cat > src/app/api/checkout/route.ts << 'ENDOFFILE'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { playerNames, totalAmountCents, clubName, guardianEmail } = body

    if (!playerNames || !totalAmountCents || !clubName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${clubName} Registration`,
              description: `Player(s): ${playerNames.join(', ')}`,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: guardianEmail,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rugby-register.vercel.app'}/stingrays/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rugby-register.vercel.app'}/stingrays`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
ENDOFFILE