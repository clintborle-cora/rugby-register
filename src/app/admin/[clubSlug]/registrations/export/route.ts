import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth/check-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubSlug: string }> }
) {
  const { clubSlug } = await params

  // Check admin permissions
  try {
    await requirePermission(clubSlug, 'can_export_data')
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get club
  const { data: club } = await supabase
    .from('clubs')
    .select('id, name, settings')
    .eq('slug', clubSlug)
    .single()

  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 })
  }

  const currentSeason = club.settings?.current_season || '2025-26-winter'

  // Get all registrations
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      id,
      status,
      division,
      payment_amount_cents,
      payment_date,
      created_at,
      player:players(
        id,
        first_name,
        last_name,
        date_of_birth,
        gender,
        headshot_url,
        dob_document_url,
        medical_conditions,
        allergies,
        emergency_contact_name,
        emergency_contact_phone,
        guardian:guardians(
          first_name,
          last_name,
          email,
          phone,
          address_line1,
          city,
          state,
          postal_code
        )
      )
    `)
    .eq('club_id', club.id)
    .eq('season', currentSeason)
    .order('created_at', { ascending: false })

  // Generate CSV
  const headers = [
    'Player First Name',
    'Player Last Name',
    'Date of Birth',
    'Gender',
    'Division',
    'Guardian First Name',
    'Guardian Last Name',
    'Guardian Email',
    'Guardian Phone',
    'Address',
    'City',
    'State',
    'Zip',
    'Status',
    'Payment',
    'Payment Date',
    'Headshot',
    'DOB Document',
    'Medical Conditions',
    'Allergies',
    'Emergency Contact',
    'Emergency Phone',
    'Registered At',
  ]

  const rows = (registrations || []).map((reg: any) => [
    reg.player?.first_name || '',
    reg.player?.last_name || '',
    reg.player?.date_of_birth || '',
    reg.player?.gender || '',
    reg.division || '',
    reg.player?.guardian?.first_name || '',
    reg.player?.guardian?.last_name || '',
    reg.player?.guardian?.email || '',
    reg.player?.guardian?.phone || '',
    reg.player?.guardian?.address_line1 || '',
    reg.player?.guardian?.city || '',
    reg.player?.guardian?.state || '',
    reg.player?.guardian?.postal_code || '',
    reg.status || '',
    reg.payment_amount_cents ? `$${(reg.payment_amount_cents / 100).toFixed(2)}` : '',
    reg.payment_date ? new Date(reg.payment_date).toLocaleDateString() : '',
    reg.player?.headshot_url ? 'Yes' : 'No',
    reg.player?.dob_document_url ? 'Yes' : 'No',
    reg.player?.medical_conditions || '',
    reg.player?.allergies || '',
    reg.player?.emergency_contact_name || '',
    reg.player?.emergency_contact_phone || '',
    reg.created_at ? new Date(reg.created_at).toLocaleDateString() : '',
  ])

  // Escape CSV fields
  const escapeCSV = (field: string) => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  const csv = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n')

  // Return CSV file
  const filename = `${club.name.replace(/\s+/g, '_')}_registrations_${currentSeason}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
