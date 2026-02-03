'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface AdminUser {
  id: string
  club_id: string
  user_id: string
  email: string
  name: string | null
  role: 'owner' | 'admin' | 'volunteer'
  permissions: {
    can_view_registrations: boolean
    can_export_data: boolean
    can_send_reminders: boolean
    can_manage_admins: boolean
    can_manage_settings: boolean
    can_process_refunds: boolean
  }
}

// Get current admin user for a club
export async function getCurrentAdmin(clubSlug: string): Promise<AdminUser | null> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get club
  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', clubSlug)
    .single()

  if (!club) return null

  // Check if user is an admin for this club
  const { data: admin } = await supabase
    .from('club_admins')
    .select('*')
    .eq('club_id', club.id)
    .eq('user_id', user.id)
    .single()

  if (!admin) return null

  return admin as AdminUser
}

// Require admin access or redirect
export async function requireAdmin(clubSlug: string): Promise<AdminUser> {
  const admin = await getCurrentAdmin(clubSlug)

  if (!admin) {
    redirect(`/login?redirect=/admin/${clubSlug}`)
  }

  return admin
}

// Check if admin has specific permission
export async function hasPermission(
  admin: AdminUser,
  permission: keyof AdminUser['permissions']
): boolean {
  // Owners have all permissions
  if (admin.role === 'owner') return true
  // Admins have all permissions
  if (admin.role === 'admin') return true
  // Volunteers check specific permissions
  return admin.permissions[permission]
}

// Require specific permission or throw
export async function requirePermission(
  clubSlug: string,
  permission: keyof AdminUser['permissions']
): Promise<AdminUser> {
  const admin = await requireAdmin(clubSlug)

  if (!hasPermission(admin, permission)) {
    throw new Error('Insufficient permissions')
  }

  return admin
}
