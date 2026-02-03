-- Rugby Registration Platform Schema
-- Multi-tenant from Day 1, but simple for single club use

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- =============================================================================
-- CLUBS (the tenants)
-- =============================================================================
create table public.clubs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique, -- URL-friendly identifier (e.g., 'stingrays')
  
  -- Branding
  logo_url text,
  primary_color text default '#ef4444', -- hex color
  website_url text,
  
  -- Contact
  contact_email text not null,
  contact_phone text,
  
  -- Location
  city text,
  state text,
  region text, -- e.g., 'SoCal Youth Rugby'
  
  -- Settings (JSON for flexibility)
  settings jsonb default '{
    "seasons": ["winter", "spring", "summer-7s"],
    "current_season": "2025-26-winter",
    "divisions": ["U8", "U10", "U12", "U14", "U16", "U18", "GU15", "GU18"],
    "require_weight_verification": ["U10", "U12"],
    "usa_rugby_fees": {
      "flag": 1600,
      "contact": 4100
    }
  }'::jsonb,
  
  -- Fees (stored in cents to avoid floating point issues)
  club_dues_cents integer not null default 25000, -- $250.00
  
  -- Stripe
  stripe_account_id text, -- Connected account ID for Stripe Connect
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =============================================================================
-- GUARDIANS (parents/guardians who register players)
-- =============================================================================
create table public.guardians (
  id uuid primary key default uuid_generate_v4(),
  
  -- Auth (links to Supabase auth.users)
  user_id uuid references auth.users(id) on delete set null,
  
  -- Contact info
  email text not null,
  first_name text not null,
  last_name text not null,
  phone text,
  
  -- Address
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'USA',
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for email lookups
create index guardians_email_idx on public.guardians(email);

-- =============================================================================
-- PLAYERS (the kids)
-- =============================================================================
create table public.players (
  id uuid primary key default uuid_generate_v4(),
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  
  -- Basic info
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  gender text not null check (gender in ('male', 'female', 'other')),
  
  -- Documents
  headshot_url text,
  dob_document_url text, -- birth certificate, passport, etc.
  headshot_verified boolean default false,
  dob_verified boolean default false,
  
  -- External IDs (once registered with USA Rugby)
  usa_rugby_id text,
  
  -- Medical
  medical_conditions text,
  allergies text,
  
  -- Emergency contact (if different from guardian)
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for guardian lookups
create index players_guardian_id_idx on public.players(guardian_id);

-- =============================================================================
-- REGISTRATIONS (player + club + season)
-- =============================================================================
create type registration_status as enum (
  'draft',           -- Started but not paid
  'paid',            -- Payment received, awaiting external registration
  'submitted',       -- Submitted to MatchFacts/Rugby Xplorer
  'pending_verification', -- Awaiting USA Rugby age verification
  'verified',        -- USA Rugby verified
  'complete',        -- Fully rostered and ready to play
  'cancelled',       -- Cancelled/refunded
  'waitlist'         -- On waitlist (for capacity limits)
);

create table public.registrations (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references public.players(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  
  -- Season info
  season text not null, -- e.g., '2025-26-winter'
  division text not null, -- e.g., 'U12', 'GU15'
  
  -- Status tracking
  status registration_status default 'draft',
  
  -- Individual step tracking
  club_dues_paid boolean default false,
  socal_registered boolean default false,
  usa_rugby_registered boolean default false,
  usa_rugby_age_verified boolean default false,
  weight_verified boolean default false,
  weight_kg numeric(5,2), -- Actual weight if verified
  weight_verified_at timestamptz,
  
  -- External submission tracking
  matchfacts_submitted_at timestamptz,
  matchfacts_player_id text, -- Their ID in MatchFacts
  rugby_xplorer_submitted_at timestamptz,
  
  -- Payment info
  payment_amount_cents integer,
  payment_stripe_id text, -- Stripe PaymentIntent ID
  payment_date timestamptz,
  
  -- Admin notes
  notes text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Prevent duplicate registrations
  unique(player_id, club_id, season)
);

-- Indexes
create index registrations_club_season_idx on public.registrations(club_id, season);
create index registrations_status_idx on public.registrations(status);
create index registrations_player_id_idx on public.registrations(player_id);

-- =============================================================================
-- PAYMENTS (detailed ledger)
-- =============================================================================
create type payment_status as enum (
  'pending',
  'processing',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded'
);

create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  
  -- Amounts (in cents)
  total_amount_cents integer not null,
  club_portion_cents integer not null,
  usa_rugby_portion_cents integer not null,
  platform_fee_cents integer default 0,
  stripe_fee_cents integer, -- Calculated after charge
  
  -- Stripe details
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_receipt_url text,
  
  -- Status
  status payment_status default 'pending',
  
  -- Refund tracking
  refund_amount_cents integer,
  refund_reason text,
  refunded_at timestamptz,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index payments_registration_id_idx on public.payments(registration_id);
create index payments_club_id_idx on public.payments(club_id);
create index payments_stripe_payment_intent_id_idx on public.payments(stripe_payment_intent_id);

-- =============================================================================
-- CLUB ADMINS
-- =============================================================================
create type admin_role as enum ('owner', 'admin', 'volunteer');

create table public.club_admins (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  
  email text not null,
  name text,
  role admin_role default 'volunteer',
  
  -- Permissions (JSON for flexibility)
  permissions jsonb default '{
    "can_view_registrations": true,
    "can_export_data": true,
    "can_send_reminders": false,
    "can_manage_admins": false,
    "can_manage_settings": false,
    "can_process_refunds": false
  }'::jsonb,
  
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  created_at timestamptz default now(),
  
  unique(club_id, email)
);

-- =============================================================================
-- SEASONS (for managing registration periods)
-- =============================================================================
create table public.seasons (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  
  slug text not null, -- e.g., '2025-26-winter'
  name text not null, -- e.g., 'Winter 2025-26'
  
  -- Dates
  registration_opens timestamptz,
  registration_closes timestamptz,
  season_starts date,
  season_ends date,
  
  -- Pricing (override club defaults if needed)
  club_dues_cents integer,
  
  -- Capacity
  max_players integer, -- null = unlimited
  
  -- Status
  is_active boolean default true,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(club_id, slug)
);

-- =============================================================================
-- WEIGH-IN EVENTS (for U10/U12)
-- =============================================================================
create table public.weighin_events (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid references public.clubs(id) on delete cascade, -- null = regional event
  
  name text not null,
  location text not null,
  address text,
  
  event_date date not null,
  start_time time not null,
  end_time time not null,
  
  notes text,
  
  created_at timestamptz default now()
);

-- =============================================================================
-- EMAIL LOG (for tracking sent notifications)
-- =============================================================================
create type email_type as enum (
  'registration_confirmation',
  'payment_receipt',
  'usa_rugby_reminder',
  'weight_verification_reminder',
  'registration_complete',
  'admin_notification'
);

create table public.email_log (
  id uuid primary key default uuid_generate_v4(),
  
  recipient_email text not null,
  email_type email_type not null,
  subject text not null,
  
  -- References
  registration_id uuid references public.registrations(id) on delete set null,
  guardian_id uuid references public.guardians(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  
  -- Status
  sent_at timestamptz default now(),
  delivered boolean,
  opened boolean,
  
  -- For debugging
  template_data jsonb
);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamps
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clubs_updated_at before update on public.clubs
  for each row execute function update_updated_at();

create trigger guardians_updated_at before update on public.guardians
  for each row execute function update_updated_at();

create trigger players_updated_at before update on public.players
  for each row execute function update_updated_at();

create trigger registrations_updated_at before update on public.registrations
  for each row execute function update_updated_at();

create trigger payments_updated_at before update on public.payments
  for each row execute function update_updated_at();

-- Function to calculate division from DOB
create or replace function calculate_division(dob date, gender text)
returns text as $$
declare
  age_on_aug31 integer;
  cutoff_date date;
begin
  -- USA Rugby uses Aug 31 as the age cutoff
  cutoff_date := make_date(extract(year from current_date)::integer, 8, 31);
  if current_date < cutoff_date then
    cutoff_date := cutoff_date - interval '1 year';
  end if;
  
  age_on_aug31 := extract(year from age(cutoff_date, dob));
  
  -- Determine division based on age and gender
  if age_on_aug31 < 8 then return 'U8';
  elsif age_on_aug31 < 10 then return 'U10';
  elsif age_on_aug31 < 12 then return 'U12';
  elsif age_on_aug31 < 14 then return 'U14';
  elsif age_on_aug31 < 16 then
    if gender = 'female' then return 'GU15';
    else return 'U16';
    end if;
  elsif age_on_aug31 < 18 then
    if gender = 'female' then return 'GU18';
    else return 'U18';
    end if;
  else
    return 'Adult';
  end if;
end;
$$ language plpgsql immutable;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

alter table public.clubs enable row level security;
alter table public.guardians enable row level security;
alter table public.players enable row level security;
alter table public.registrations enable row level security;
alter table public.payments enable row level security;
alter table public.club_admins enable row level security;
alter table public.seasons enable row level security;
alter table public.weighin_events enable row level security;
alter table public.email_log enable row level security;

-- Clubs: Public read for active clubs
create policy "Clubs are viewable by everyone" on public.clubs
  for select using (true);

-- Guardians: Users can only see their own data
create policy "Guardians can view own data" on public.guardians
  for select using (auth.uid() = user_id);

create policy "Guardians can update own data" on public.guardians
  for update using (auth.uid() = user_id);

-- Players: Guardians can manage their own players
create policy "Guardians can view own players" on public.players
  for select using (
    guardian_id in (select id from public.guardians where user_id = auth.uid())
  );

create policy "Guardians can insert own players" on public.players
  for insert with check (
    guardian_id in (select id from public.guardians where user_id = auth.uid())
  );

create policy "Guardians can update own players" on public.players
  for update using (
    guardian_id in (select id from public.guardians where user_id = auth.uid())
  );

-- Registrations: Guardians can view their players' registrations
create policy "Guardians can view own registrations" on public.registrations
  for select using (
    player_id in (
      select p.id from public.players p
      join public.guardians g on p.guardian_id = g.id
      where g.user_id = auth.uid()
    )
  );

-- Club admins can view all registrations for their club
create policy "Admins can view club registrations" on public.registrations
  for select using (
    club_id in (
      select club_id from public.club_admins where user_id = auth.uid()
    )
  );

-- Payments: Similar to registrations
create policy "Guardians can view own payments" on public.payments
  for select using (guardian_id in (select id from public.guardians where user_id = auth.uid()));

create policy "Admins can view club payments" on public.payments
  for select using (
    club_id in (select club_id from public.club_admins where user_id = auth.uid())
  );

-- Club admins: Admins can view their own club's admin list
create policy "Admins can view club admins" on public.club_admins
  for select using (
    club_id in (select club_id from public.club_admins where user_id = auth.uid())
    or user_id = auth.uid()
  );

-- Seasons: Public read
create policy "Seasons are viewable by everyone" on public.seasons
  for select using (true);

-- Weigh-in events: Public read
create policy "Weighin events are viewable by everyone" on public.weighin_events
  for select using (true);

-- =============================================================================
-- SEED DATA: SB Stingrays
-- =============================================================================

insert into public.clubs (
  name,
  slug,
  contact_email,
  city,
  state,
  region,
  website_url,
  club_dues_cents,
  settings
) values (
  'SB Stingrays',
  'stingrays',
  'coach@stingraysrfc.com',
  'Santa Barbara',
  'CA',
  'SoCal Youth Rugby',
  'https://stingraysrfc.com',
  25000, -- $250
  '{
    "seasons": ["winter", "spring", "summer-7s"],
    "current_season": "2025-26-winter",
    "divisions": ["U8", "U10", "U12", "U14"],
    "require_weight_verification": ["U10", "U12"],
    "usa_rugby_fees": {
      "flag": 1600,
      "contact": 3000
    },
    "practice_location": "UCSB West Campus Field",
    "practice_schedule": "Tuesdays & Thursdays 5:30pm"
  }'::jsonb
);

-- Insert the winter season
insert into public.seasons (
  club_id,
  slug,
  name,
  registration_opens,
  registration_closes,
  season_starts,
  season_ends,
  is_active
)
select 
  id,
  '2025-26-winter',
  'Winter 2025-26',
  '2025-10-01'::timestamptz,
  '2026-01-15'::timestamptz,
  '2026-01-10'::date,
  '2026-03-07'::date,
  true
from public.clubs where slug = 'stingrays';

-- Insert a weigh-in event
insert into public.weighin_events (
  club_id,
  name,
  location,
  address,
  event_date,
  start_time,
  end_time,
  notes
)
select
  id,
  'SoCal Youth Rugby Regional Weigh-In',
  'Torrey Pines Elementary',
  '8350 Cliffridge Ave, La Jolla, CA 92037',
  '2025-12-07'::date,
  '09:00'::time,
  '12:00'::time,
  'Players must attend in shorts, jersey, and cleats. No exceptions.'
from public.clubs where slug = 'stingrays';
