import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Helper to create a checkout session for registration payment
export async function createCheckoutSession({
  registrationIds,
  clubName,
  playerNames,
  totalAmountCents,
  successUrl,
  cancelUrl,
  metadata,
}: {
  registrationIds: string[]
  clubName: string
  playerNames: string[]
  totalAmountCents: number
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) {
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
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      registration_ids: registrationIds.join(','),
      ...metadata,
    },
  })

  return session
}

// Helper to verify webhook signature
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
