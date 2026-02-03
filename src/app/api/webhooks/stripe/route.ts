import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail, type WelcomeEmailData } from '@/lib/email'

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

      // Gather data for welcome email
      let guardianId: string | null = null
      let clubData: any = null
      const players: { name: string; division: string }[] = []
      let totalAmountCents = 0
      let documentsComplete = true

      // Create payment record and gather email data
      for (const regId of registrationIds) {
        const { data: reg } = await supabase
          .from('registrations')
          .select(`
            *,
            club:clubs(*),
            player:players(
              id,
              first_name,
              last_name,
              guardian_id,
              headshot_url,
              dob_document_url
            )
          `)
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
            stripe_charge_id: session.payment_intent,
            status: 'succeeded',
          })

          // Collect data for email
          guardianId = reg.player.guardian_id
          clubData = reg.club
          players.push({
            name: `${reg.player.first_name} ${reg.player.last_name}`,
            division: reg.division,
          })
          totalAmountCents += reg.club.club_dues_cents + usaRugbyFee

          // Check if documents are complete
          if (!reg.player.headshot_url || !reg.player.dob_document_url) {
            documentsComplete = false
          }
        }
      }

      // Send welcome email
      if (guardianId && clubData) {
        const { data: guardian } = await supabase
          .from('guardians')
          .select('*')
          .eq('id', guardianId)
          .single()

        if (guardian) {
          try {
            const emailData: WelcomeEmailData = {
              guardianName: `${guardian.first_name} ${guardian.last_name}`,
              guardianEmail: guardian.email,
              clubName: clubData.name,
              clubEmail: clubData.contact_email,
              players,
              totalPaid: `$${(totalAmountCents / 100).toFixed(2)}`,
              practiceLocation: clubData.settings?.practice_location,
              practiceSchedule: clubData.settings?.practice_schedule,
              documentsComplete,
              documentsUploadUrl: !documentsComplete
                ? `${process.env.NEXT_PUBLIC_APP_URL}/${clubData.slug}/documents/${registrationIds[0]}`
                : undefined,
            }

            await sendWelcomeEmail(emailData)
            console.log('Welcome email sent to:', guardian.email)

            // Log the email
            await supabase.from('email_log').insert({
              recipient_email: guardian.email,
              email_type: 'registration_confirmation',
              subject: `Welcome to ${clubData.name}! Registration Confirmed`,
              registration_id: registrationIds[0],
              guardian_id: guardianId,
              club_id: clubData.id,
              sent_at: new Date().toISOString(),
              delivered: true,
              template_data: emailData as any,
            })
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError)
            // Don't fail the webhook if email fails
          }
        }
      }

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
