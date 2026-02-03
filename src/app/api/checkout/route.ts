import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationIds, clubId, guardianEmail } = body

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json(
        { error: 'Registration IDs are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Fetch registrations with player and club data
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        player:players(*),
        club:clubs(*)
      `)
      .in('id', registrationIds)

    if (regError || !registrations || registrations.length === 0) {
      return NextResponse.json(
        { error: 'Registrations not found' },
        { status: 404 }
      )
    }

    // Calculate total amount
    let totalCents = 0
    const playerNames: string[] = []

    registrations.forEach((reg: any) => {
      playerNames.push(`${reg.player.first_name} ${reg.player.last_name}`)
      
      // Club dues
      totalCents += reg.club.club_dues_cents

      // USA Rugby fee
      const isFlag = reg.division === 'U8'
      const usaFee = isFlag 
        ? reg.club.settings.usa_rugby_fees.flag 
        : reg.club.settings.usa_rugby_fees.contact
      totalCents += usaFee
    })

    const club = registrations[0].club

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      registrationIds,
      clubName: club.name,
      playerNames,
      totalAmountCents: totalCents,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${club.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${club.slug}?cancelled=true`,
      metadata: {
        club_id: clubId,
        guardian_email: guardianEmail,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
