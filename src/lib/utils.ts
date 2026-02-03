import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format cents to dollars
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

// Calculate age from date of birth
export function calculateAge(dob: string | Date): number {
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Calculate age on Aug 31 (USA Rugby cutoff)
export function calculateAgeOnAug31(dob: string | Date): number {
  const birthDate = new Date(dob)
  const currentYear = new Date().getFullYear()
  let cutoffDate = new Date(currentYear, 7, 31) // Aug 31
  
  // If we're before Aug 31, use last year's cutoff
  if (new Date() < cutoffDate) {
    cutoffDate = new Date(currentYear - 1, 7, 31)
  }
  
  let age = cutoffDate.getFullYear() - birthDate.getFullYear()
  const monthDiff = cutoffDate.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && cutoffDate.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Calculate division from DOB and gender
export function calculateDivision(dob: string | Date, gender: 'male' | 'female' | 'other'): string {
  const age = calculateAgeOnAug31(dob)
  
  if (age < 8) return 'U8'
  if (age < 10) return 'U10'
  if (age < 12) return 'U12'
  if (age < 14) return 'U14'
  if (age < 16) return gender === 'female' ? 'GU15' : 'U16'
  if (age < 18) return gender === 'female' ? 'GU18' : 'U18'
  return 'Adult'
}

// Check if division requires weight verification
export function requiresWeightVerification(division: string): boolean {
  return ['U10', 'U12'].includes(division)
}

// Check if division is flag rugby (non-contact)
export function isFlagDivision(division: string): boolean {
  return division === 'U8'
}

// Calculate USA Rugby fee based on division
export function calculateUsaRugbyFee(division: string, settings: { flag: number; contact: number }): number {
  return isFlagDivision(division) ? settings.flag : settings.contact
}

// Format date for display
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

// Format date and time for display
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

// Format time only
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone format (US)
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10 || cleaned.length === 11
}

// Format phone number for display
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

// Generate a URL-safe slug
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Get initials from name
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
}

// Status display helpers
export const statusLabels: Record<string, string> = {
  draft: 'Draft',
  paid: 'Paid - Awaiting Registration',
  submitted: 'Submitted',
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  complete: 'Complete',
  cancelled: 'Cancelled',
  waitlist: 'Waitlist',
}

export const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  paid: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-blue-100 text-blue-800',
  pending_verification: 'bg-orange-100 text-orange-800',
  verified: 'bg-green-100 text-green-800',
  complete: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  waitlist: 'bg-purple-100 text-purple-800',
}
