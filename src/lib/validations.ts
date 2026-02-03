import { z } from 'zod'

// =============================================================================
// Guardian Schema
// =============================================================================
export const guardianSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().optional().refine((val) => {
    if (!val) return true
    const cleaned = val.replace(/\D/g, '')
    return cleaned.length === 10 || cleaned.length === 11
  }, 'Please enter a valid phone number'),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
})

export type GuardianFormData = z.infer<typeof guardianSchema>

// =============================================================================
// Player Schema
// =============================================================================
export const playerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  date_of_birth: z.string().refine((val) => {
    const date = new Date(val)
    const now = new Date()
    const minAge = new Date(now.getFullYear() - 25, now.getMonth(), now.getDate())
    const maxAge = new Date(now.getFullYear() - 4, now.getMonth(), now.getDate())
    return date >= minAge && date <= maxAge
  }, 'Player must be between 4 and 25 years old'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  medical_conditions: z.string().optional(),
  allergies: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  emergency_contact_relationship: z.string().optional(),
})

export type PlayerFormData = z.infer<typeof playerSchema>

// =============================================================================
// Full Registration Schema (multi-step form)
// =============================================================================
export const registrationSchema = z.object({
  // Step 1: Guardian info
  guardian: guardianSchema,
  
  // Step 2: Player(s) info
  players: z.array(playerSchema).min(1, 'At least one player is required'),
  
  // Step 3: Documents (handled separately via file upload)
  
  // Step 4: Waivers
  waivers: z.object({
    socal_waiver_accepted: z.boolean().refine(val => val === true, {
      message: 'You must accept the SoCal Youth Rugby waiver',
    }),
    usa_rugby_waiver_accepted: z.boolean().refine(val => val === true, {
      message: 'You must accept the USA Rugby waiver',
    }),
    club_waiver_accepted: z.boolean().refine(val => val === true, {
      message: 'You must accept the club code of conduct',
    }),
  }),
})

export type RegistrationFormData = z.infer<typeof registrationSchema>

// =============================================================================
// Document Upload Schema
// =============================================================================
export const documentUploadSchema = z.object({
  player_id: z.string().uuid(),
  headshot: z.object({
    file: z.any(), // File object
    preview: z.string().optional(),
  }).optional(),
  dob_document: z.object({
    file: z.any(),
    preview: z.string().optional(),
  }).optional(),
})

// =============================================================================
// Admin Schemas
// =============================================================================
export const updateRegistrationStatusSchema = z.object({
  registration_id: z.string().uuid(),
  status: z.enum([
    'draft',
    'paid',
    'submitted',
    'pending_verification',
    'verified',
    'complete',
    'cancelled',
    'waitlist',
  ]),
  notes: z.string().optional(),
})

export const markExternalRegistrationSchema = z.object({
  registration_id: z.string().uuid(),
  field: z.enum([
    'socal_registered',
    'usa_rugby_registered',
    'usa_rugby_age_verified',
    'weight_verified',
  ]),
  value: z.boolean(),
  weight_kg: z.number().positive().optional(), // Only for weight_verified
})

export const bulkActionSchema = z.object({
  registration_ids: z.array(z.string().uuid()).min(1),
  action: z.enum([
    'mark_submitted',
    'send_reminder',
    'export_csv',
  ]),
})

// =============================================================================
// Checkout/Payment Schema
// =============================================================================
export const checkoutSchema = z.object({
  registration_ids: z.array(z.string().uuid()).min(1),
  // The rest is calculated server-side
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>
