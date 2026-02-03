'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get guardian record linked to the current auth user
export async function getGuardianByUserId(userId: string) {
  const supabase = await createClient()

  const { data: guardian, error } = await supabase
    .from('guardians')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Error fetching guardian:', error)
    return null
  }

  return guardian
}

// Link a guardian record to an auth user (for first-time registration)
export async function linkGuardianToAuth(guardianId: string, userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('guardians')
    .update({ user_id: userId })
    .eq('id', guardianId)

  if (error) {
    console.error('Error linking guardian to auth:', error)
    throw new Error('Failed to link guardian account')
  }
}

// Create or get guardian for the current user
export async function getOrCreateGuardian(email: string, userId: string) {
  const supabase = await createClient()

  // First check if guardian already exists for this user
  const { data: existing } = await supabase
    .from('guardians')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) return existing

  // Check if guardian exists by email (from previous registration)
  const { data: byEmail } = await supabase
    .from('guardians')
    .select('*')
    .eq('email', email)
    .is('user_id', null) // Not yet linked to any auth user
    .single()

  if (byEmail) {
    // Link existing guardian to this auth user
    await linkGuardianToAuth(byEmail.id, userId)
    return { ...byEmail, user_id: userId }
  }

  // Create new guardian record
  const { data: newGuardian, error } = await supabase
    .from('guardians')
    .insert({
      email,
      user_id: userId,
      first_name: '', // Will be filled in during registration
      last_name: '',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating guardian:', error)
    throw new Error('Failed to create guardian account')
  }

  return newGuardian
}

// Sign out
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
