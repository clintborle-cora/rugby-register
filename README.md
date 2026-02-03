# Rugby Register

A streamlined registration platform for youth rugby clubs. Built to solve the pain of parents having to navigate multiple platforms (MatchFacts, Rugby Xplorer, club payments) to register their kids for rugby.

## The Problem

Currently, parents must:
1. Create account on MatchFacts
2. Register with SoCal Youth Rugby
3. Create separate account on Rugby Xplorer  
4. Register with USA Rugby
5. Wait for verification email (often missed)
6. Possibly attend weight verification
7. Pay club dues separately

**This takes 45-60 minutes and causes endless confusion.**

## The Solution

One form. One payment. We handle the rest.

Parents fill out a 5-step wizard, pay once, and we:
- Submit to MatchFacts on their behalf
- Submit to USA Rugby on their behalf
- Track verification status
- Send reminders for outstanding tasks

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Stripe account (for payments)

### Setup

1. **Clone and install:**
   ```bash
   git clone <your-repo>
   cd rugby-register
   npm install
   ```

2. **Set up Supabase:**
   - Create a new Supabase project at https://supabase.com
   - Go to SQL Editor and run the migration:
     ```bash
     cat supabase/migrations/001_initial_schema.sql
     ```
   - Copy your project URL and anon key from Settings > API

3. **Set up Stripe:**
   - Create a Stripe account at https://stripe.com
   - Get your test API keys from Developers > API keys

4. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run locally:**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:3000/stingrays

### Stripe Webhooks (for local development)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
npm run stripe:listen
```

## Project Structure

```
rugby-register/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── [club]/            # Dynamic club registration pages
│   │   ├── admin/             # Admin dashboard (TODO)
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── forms/             # Registration wizard components
│   │   ├── dashboard/         # Admin dashboard components
│   │   └── ui/                # Reusable UI components
│   ├── lib/
│   │   ├── supabase/          # Supabase client utilities
│   │   ├── utils.ts           # Helper functions
│   │   └── validations.ts     # Zod schemas
│   └── types/                 # TypeScript types
├── supabase/
│   └── migrations/            # Database migrations
└── public/                    # Static assets
```

## Database Schema

The database is multi-tenant ready from day one:

- **clubs** - Rugby clubs (tenants)
- **guardians** - Parents/guardians who register players
- **players** - The kids being registered
- **registrations** - Player + Club + Season records
- **payments** - Payment ledger
- **club_admins** - Admin users per club
- **seasons** - Registration periods
- **weighin_events** - Weight verification events

## Key Features

### For Parents
- Single form, single payment
- Document upload (headshots, birth certificates)
- Automatic division calculation based on DOB
- Clear status tracking
- Email reminders

### For Club Admins
- Dashboard showing registration status
- CSV export for MatchFacts bulk upload
- Payment tracking
- Reminder sending

## Adding a New Club

1. Insert into `clubs` table:
   ```sql
   INSERT INTO clubs (name, slug, contact_email, club_dues_cents, ...)
   VALUES ('New Club', 'newclub', 'coach@newclub.com', 25000, ...);
   ```

2. Registration is now available at `/newclub`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app is a standard Next.js application and can be deployed anywhere that supports Node.js.

## Roadmap

- [x] Registration wizard
- [x] Multi-tenant database schema
- [ ] Stripe payment integration
- [ ] Admin dashboard
- [ ] Email notifications (Resend)
- [ ] MatchFacts CSV export
- [ ] Browser automation for external registration
- [ ] Kit management module
- [ ] Sponsorship management

## Contributing

This started as a solution for SB Stingrays but is designed to work for any USA Rugby youth club. PRs welcome!

## License

MIT
