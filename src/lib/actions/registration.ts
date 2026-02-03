'use server'

import { createClient } from '@/lib/supabase/server'
import type { RegistrationData } from '@/components/forms/registration-wizard'

// Save or update a draft registration
export async function saveDraftRegistration(
  clubId: string,
  season: string,
  guardianId: string,
  data: RegistrationData,
  currentStep: number
) {
  const supabase = await createClient()

  // First, ensure guardian record is up to date
  if (data.guardian) {
    const { error: guardianError } = await supabase
      .from('guardians')
      .update({
        first_name: data.guardian.first_name,
        last_name: data.guardian.last_name,
        phone: data.guardian.phone,
        address_line1: data.guardian.address_line1,
        address_line2: data.guardian.address_line2 || null,
        city: data.guardian.city,
        state: data.guardian.state,
        postal_code: data.guardian.postal_code,
      })
      .eq('id', guardianId)

    if (guardianError) {
      console.error('Error updating guardian:', guardianError)
    }
  }

  // Save/update each player and their registration
  for (const player of data.players) {
    // Check if player exists
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('guardian_id', guardianId)
      .eq('first_name', player.first_name)
      .eq('last_name', player.last_name)
      .eq('date_of_birth', player.date_of_birth)
      .single()

    let playerId = existingPlayer?.id

    if (!playerId) {
      // Create new player
      const { data: newPlayer, error: playerError } = await supabase
        .from('players')
        .insert({
          guardian_id: guardianId,
          first_name: player.first_name,
          last_name: player.last_name,
          date_of_birth: player.date_of_birth,
          gender: player.gender,
          medical_conditions: player.medical_conditions || null,
          allergies: player.allergies || null,
          emergency_contact_name: player.emergency_contact_name || null,
          emergency_contact_phone: player.emergency_contact_phone || null,
          emergency_contact_relationship: player.emergency_contact_relationship || null,
        })
        .select()
        .single()

      if (playerError) {
        console.error('Error creating player:', playerError)
        continue
      }
      playerId = newPlayer.id
    } else {
      // Update existing player
      await supabase
        .from('players')
        .update({
          gender: player.gender,
          medical_conditions: player.medical_conditions || null,
          allergies: player.allergies || null,
          emergency_contact_name: player.emergency_contact_name || null,
          emergency_contact_phone: player.emergency_contact_phone || null,
          emergency_contact_relationship: player.emergency_contact_relationship || null,
        })
        .eq('id', playerId)
    }

    // Create or update draft registration
    const { data: existingReg } = await supabase
      .from('registrations')
      .select('id')
      .eq('player_id', playerId)
      .eq('club_id', clubId)
      .eq('season', season)
      .single()

    if (existingReg) {
      await supabase
        .from('registrations')
        .update({
          division: player.division,
          status: 'draft',
          notes: JSON.stringify({ currentStep, tempPlayerId: player.id }),
        })
        .eq('id', existingReg.id)
    } else {
      await supabase
        .from('registrations')
        .insert({
          player_id: playerId,
          club_id: clubId,
          season,
          division: player.division,
          status: 'draft',
          notes: JSON.stringify({ currentStep, tempPlayerId: player.id }),
        })
    }
  }

  return { success: true }
}

// Get draft registration for a user
export async function getDraftRegistration(
  clubId: string,
  season: string,
  userId: string
): Promise<{ guardian: any; players: any[]; currentStep: number } | null> {
  const supabase = await createClient()

  // Get guardian by user_id
  const { data: guardian } = await supabase
    .from('guardians')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!guardian) return null

  // Get players and their draft registrations
  const { data: players } = await supabase
    .from('players')
    .select(`
      *,
      registrations!inner(
        id,
        division,
        status,
        notes
      )
    `)
    .eq('guardian_id', guardian.id)
    .eq('registrations.club_id', clubId)
    .eq('registrations.season', season)
    .eq('registrations.status', 'draft')

  if (!players || players.length === 0) return null

  // Find the furthest step from the draft
  let maxStep = 0
  const formattedPlayers = players.map((p: any) => {
    const reg = p.registrations[0]
    let notes: any = {}
    try {
      notes = JSON.parse(reg.notes || '{}')
    } catch {
      notes = {}
    }
    if (notes.currentStep > maxStep) {
      maxStep = notes.currentStep
    }
    return {
      id: notes.tempPlayerId || p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      date_of_birth: p.date_of_birth,
      gender: p.gender,
      division: reg.division,
      medical_conditions: p.medical_conditions,
      allergies: p.allergies,
      emergency_contact_name: p.emergency_contact_name,
      emergency_contact_phone: p.emergency_contact_phone,
      emergency_contact_relationship: p.emergency_contact_relationship,
    }
  })

  return {
    guardian: {
      first_name: guardian.first_name,
      last_name: guardian.last_name,
      email: guardian.email,
      phone: guardian.phone,
      address_line1: guardian.address_line1,
      address_line2: guardian.address_line2,
      city: guardian.city,
      state: guardian.state,
      postal_code: guardian.postal_code,
    },
    players: formattedPlayers,
    currentStep: maxStep,
  }
}
