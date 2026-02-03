// Types matching our Supabase schema
// These will be auto-generated in production via `npm run db:generate`

export type RegistrationStatus = 
  | 'draft'
  | 'paid'
  | 'submitted'
  | 'pending_verification'
  | 'verified'
  | 'complete'
  | 'cancelled'
  | 'waitlist';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type AdminRole = 'owner' | 'admin' | 'volunteer';

export type Gender = 'male' | 'female' | 'other';

export type EmailType = 
  | 'registration_confirmation'
  | 'payment_receipt'
  | 'usa_rugby_reminder'
  | 'weight_verification_reminder'
  | 'registration_complete'
  | 'admin_notification';

// =============================================================================
// Database Row Types
// =============================================================================

export interface Club {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  website_url: string | null;
  contact_email: string;
  contact_phone: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
  settings: ClubSettings;
  club_dues_cents: number;
  stripe_account_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubSettings {
  seasons: string[];
  current_season: string;
  divisions: string[];
  require_weight_verification: string[];
  usa_rugby_fees: {
    flag: number; // in cents
    contact: number; // in cents
  };
  practice_location?: string;
  practice_schedule?: string;
}

export interface Guardian {
  id: string;
  user_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  guardian_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO date string
  gender: Gender;
  headshot_url: string | null;
  dob_document_url: string | null;
  headshot_verified: boolean;
  dob_verified: boolean;
  usa_rugby_id: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  player_id: string;
  club_id: string;
  season: string;
  division: string;
  status: RegistrationStatus;
  club_dues_paid: boolean;
  socal_registered: boolean;
  usa_rugby_registered: boolean;
  usa_rugby_age_verified: boolean;
  weight_verified: boolean;
  weight_kg: number | null;
  weight_verified_at: string | null;
  matchfacts_submitted_at: string | null;
  matchfacts_player_id: string | null;
  rugby_xplorer_submitted_at: string | null;
  payment_amount_cents: number | null;
  payment_stripe_id: string | null;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  registration_id: string;
  club_id: string;
  guardian_id: string;
  total_amount_cents: number;
  club_portion_cents: number;
  usa_rugby_portion_cents: number;
  platform_fee_cents: number;
  stripe_fee_cents: number | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_receipt_url: string | null;
  status: PaymentStatus;
  refund_amount_cents: number | null;
  refund_reason: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubAdmin {
  id: string;
  club_id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  role: AdminRole;
  permissions: AdminPermissions;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface AdminPermissions {
  can_view_registrations: boolean;
  can_export_data: boolean;
  can_send_reminders: boolean;
  can_manage_admins: boolean;
  can_manage_settings: boolean;
  can_process_refunds: boolean;
}

export interface Season {
  id: string;
  club_id: string;
  slug: string;
  name: string;
  registration_opens: string | null;
  registration_closes: string | null;
  season_starts: string | null;
  season_ends: string | null;
  club_dues_cents: number | null;
  max_players: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeighinEvent {
  id: string;
  club_id: string | null;
  name: string;
  location: string;
  address: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
}

// =============================================================================
// Joined/Expanded Types (for queries with joins)
// =============================================================================

export interface RegistrationWithDetails extends Registration {
  player: Player;
  club: Club;
  guardian: Guardian;
  payment?: Payment;
}

export interface PlayerWithGuardian extends Player {
  guardian: Guardian;
}

export interface ClubWithSeasons extends Club {
  seasons: Season[];
}

// =============================================================================
// Form/Input Types
// =============================================================================

export interface GuardianInput {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export interface PlayerInput {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  medical_conditions?: string;
  allergies?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export interface RegistrationInput {
  club_slug: string;
  season: string;
  guardian: GuardianInput;
  players: PlayerInput[];
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================================================
// Dashboard/Stats Types
// =============================================================================

export interface RegistrationStats {
  total: number;
  by_status: Record<RegistrationStatus, number>;
  by_division: Record<string, number>;
  payments: {
    total_collected_cents: number;
    club_portion_cents: number;
    usa_rugby_portion_cents: number;
  };
}

export interface AdminDashboardData {
  club: Club;
  current_season: Season | null;
  stats: RegistrationStats;
  recent_registrations: RegistrationWithDetails[];
  pending_actions: {
    awaiting_submission: number;
    awaiting_verification: number;
    awaiting_weight: number;
  };
}
