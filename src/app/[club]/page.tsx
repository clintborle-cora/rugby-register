import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RegistrationWizard } from '@/components/forms/registration-wizard'
import { createClient } from '@/lib/supabase/server'
import { getUser, getGuardianByUserId } from '@/lib/actions/auth'
import { getDraftRegistration } from '@/lib/actions/registration'
import type { Club, Season, ClubSettings } from '@/types'
import { User, LogIn } from 'lucide-react'

async function getClub(slug: string): Promise<Club | null> {
  const supabase = await createClient()
  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .single()

  return club
}

async function getCurrentSeason(clubId: string): Promise<Season | null> {
  const supabase = await createClient()
  const { data: season } = await supabase
    .from('seasons')
    .select('*')
    .eq('club_id', clubId)
    .eq('is_active', true)
    .single()

  return season
}

interface PageProps {
  params: Promise<{ club: string }>
}

export default async function ClubRegistrationPage({ params }: PageProps) {
  const { club: clubSlug } = await params

  const club = await getClub(clubSlug)

  if (!club) {
    notFound()
  }

  const season = await getCurrentSeason(club.id)

  if (!season) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Not Open
          </h1>
          <p className="text-gray-600">
            Registration for {club.name} is not currently open.
            Please check back later or contact the club.
          </p>
        </div>
      </div>
    )
  }

  // Check if user is logged in and has a draft
  const user = await getUser()
  let guardian = null
  let draft = null
  let guardianId: string | undefined

  if (user) {
    guardian = await getGuardianByUserId(user.id)
    if (guardian) {
      guardianId = guardian.id
      draft = await getDraftRegistration(club.id, season.slug, user.id)
    }
  }

  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with club branding */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <a
            href={club.website_url || '#'}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {club.logo_url ? (
              <img src={club.logo_url} alt={club.name} className="h-10 w-auto" />
            ) : (
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: club.primary_color }}
              >
                {club.name[0]}
              </div>
            )}
            <span className="font-semibold text-gray-900 hidden sm:block">
              {club.name}
            </span>
          </a>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <span className="text-sm text-gray-600 flex items-center">
                <User className="h-4 w-4 mr-1" />
                {user.email}
              </span>
            ) : (
              <Link
                href={`/login?redirect=/${clubSlug}`}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Sign in to save progress
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Draft notice banner */}
      {draft && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <p className="text-sm text-blue-800">
              <strong>Welcome back!</strong> We&apos;ve restored your saved progress.
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="py-8 px-4">
        <RegistrationWizard
          club={club}
          season={season}
          existingGuardian={draft?.guardian || (guardian ? {
            first_name: guardian.first_name,
            last_name: guardian.last_name,
            email: guardian.email,
            phone: guardian.phone || '',
            address_line1: guardian.address_line1 || '',
            address_line2: guardian.address_line2 || '',
            city: guardian.city || '',
            state: guardian.state || '',
            postal_code: guardian.postal_code || '',
          } : undefined)}
          existingPlayers={draft?.players}
          initialStep={draft?.currentStep || 0}
          guardianId={guardianId}
          isLoggedIn={isLoggedIn}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>
            Powered by{' '}
            <span className="font-medium text-gray-700">Rugby Register</span>
          </p>
          <p className="mt-1">
            Questions? Contact{' '}
            <a
              href={`mailto:${club.contact_email}`}
              className="text-primary-600 hover:underline"
            >
              {club.contact_email}
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  const { club: clubSlug } = await params
  const club = await getClub(clubSlug)
  
  if (!club) {
    return {
      title: 'Club Not Found',
    }
  }
  
  return {
    title: `Register | ${club.name}`,
    description: `Register for ${club.name} youth rugby`,
  }
}
