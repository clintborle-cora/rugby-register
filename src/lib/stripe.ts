import Stripe from 'stripe'

// Initialize Stripe lazily to allow build without keys
let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  }
  return stripeInstance
}

// Export getStripe for direct Stripe access
export { getStripe }

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
  const session = await getStripe().checkout.sessions.create({
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
  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret)
}
