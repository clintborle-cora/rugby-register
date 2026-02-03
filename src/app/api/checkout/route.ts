import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerNames, totalAmountCents, clubName, guardianEmail, clubSlug } = body

    if (!playerNames || !Array.isArray(playerNames) || playerNames.length === 0) {
      return NextResponse.json(
        { error: 'Player names are required' },
        { status: 400 }
      )
    }
    if (typeof totalAmountCents !== 'number' || totalAmountCents < 0) {
      return NextResponse.json(
        { error: 'Valid total amount is required' },
        { status: 400 }
      )
    }
    if (!clubName || typeof clubName !== 'string') {
      return NextResponse.json(
        { error: 'Club name is required' },
        { status: 400 }
      )
    }
    if (!guardianEmail || typeof guardianEmail !== 'string') {
      return NextResponse.json(
        { error: 'Guardian email is required' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const slug = clubSlug && typeof clubSlug === 'string' ? clubSlug : 'club'
    const successUrl = `${baseUrl}/${slug}/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/${slug}?cancelled=true`

    const session = await createCheckoutSession({
      registrationIds: [],
      clubName,
      playerNames,
      totalAmountCents,
      successUrl,
      cancelUrl,
      metadata: {
        guardian_email: guardianEmail,
      },
      stripeAccountId: undefined,
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
