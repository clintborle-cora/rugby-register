import Stripe from 'stripe'

// Initialize Stripe lazily to allow build without keys
let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // Cast to any to allow newer API version than types support
      apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
      typescript: true,
    })
  }
  return stripeInstance
}

// Export getStripe for direct Stripe access
export { getStripe }

// Helper to create a checkout session for registration payment
// Supports Stripe Connect - money flows directly to the club's connected account
export async function createCheckoutSession({
  registrationIds,
  clubName,
  playerNames,
  totalAmountCents,
  successUrl,
  cancelUrl,
  metadata,
  stripeAccountId,
}: {
  registrationIds: string[]
  clubName: string
  playerNames: string[]
  totalAmountCents: number
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
  stripeAccountId?: string | null // Club's Stripe Connect account ID
}) {
  // Build session params
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
  }

  // If club has a connected Stripe account, use destination charges
  // This sends the full payment to the connected account
  // The platform can optionally take an application fee
  if (stripeAccountId) {
    sessionParams.payment_intent_data = {
      transfer_data: {
        destination: stripeAccountId,
      },
      // Optionally add platform fee here:
      // application_fee_amount: platformFeeCents,
    }
  }

  const session = await getStripe().checkout.sessions.create(sessionParams)

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
