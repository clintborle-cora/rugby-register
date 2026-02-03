import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event

  try {
    event = constructWebhookEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      
      // Get registration IDs from metadata
      const registrationIds = session.metadata?.registration_ids?.split(',') || []
      
      if (registrationIds.length === 0) {
        console.error('No registration IDs in session metadata')
        break
      }

      // Update registrations to paid status
      const { error: updateError } = await supabase
        .from('registrations')
        .update({
          status: 'paid',
          club_dues_paid: true,
          payment_stripe_id: session.payment_intent,
          payment_date: new Date().toISOString(),
          payment_amount_cents: session.amount_total,
        })
        .in('id', registrationIds)

      if (updateError) {
        console.error('Failed to update registrations:', updateError)
        return NextResponse.json(
          { error: 'Database update failed' },
          { status: 500 }
        )
      }

      // Create payment record
      for (const regId of registrationIds) {
        const { data: reg } = await supabase
          .from('registrations')
          .select('*, club:clubs(*), player:players(guardian_id)')
          .eq('id', regId)
          .single()

        if (reg) {
          const isFlag = reg.division === 'U8'
          const usaRugbyFee = isFlag
            ? reg.club.settings.usa_rugby_fees.flag
            : reg.club.settings.usa_rugby_fees.contact

          await supabase.from('payments').insert({
            registration_id: regId,
            club_id: reg.club_id,
            guardian_id: reg.player.guardian_id,
            total_amount_cents: reg.club.club_dues_cents + usaRugbyFee,
            club_portion_cents: reg.club.club_dues_cents,
            usa_rugby_portion_cents: usaRugbyFee,
            platform_fee_cents: 0,
            stripe_payment_intent_id: session.payment_intent,
            stripe_charge_id: session.payment_intent, // Will be updated
            status: 'succeeded',
          })
        }
      }

      // TODO: Send confirmation email
      // TODO: Queue for external registration submission

      console.log('Payment successful for registrations:', registrationIds)
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as any
      console.error('Payment failed:', paymentIntent.id)
      
      // Could update registration status or notify admin
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
