import { notFound } from 'next/navigation'
import { RegistrationWizard } from '@/components/forms/registration-wizard'
import type { Club, Season, ClubSettings } from '@/types'

// For now, we'll use mock data
// In production, this would fetch from Supabase
async function getClub(slug: string): Promise<Club | null> {
  // Mock data for Stingrays
  if (slug === 'stingrays') {
    return {
      id: '1',
      name: 'SB Stingrays',
      slug: 'stingrays',
      logo_url: null,
      primary_color: '#ef4444',
      website_url: 'https://stingraysrfc.com',
      contact_email: 'coach@stingraysrfc.com',
      contact_phone: null,
      city: 'Santa Barbara',
      state: 'CA',
      region: 'SoCal Youth Rugby',
      settings: {
        seasons: ['winter', 'spring', 'summer-7s'],
        current_season: '2025-26-winter',
        divisions: ['U8', 'U10', 'U12', 'U14'],
        require_weight_verification: ['U10', 'U12'],
        usa_rugby_fees: {
          flag: 1600, // $16 for U8 flag
          contact: 3000, // $30 for contact divisions
        },
        practice_location: 'UCSB West Campus Field',
        practice_schedule: 'Tuesdays & Thursdays 5:30pm',
      } as ClubSettings,
      club_dues_cents: 25000, // $250
      stripe_account_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
  return null
}

async function getCurrentSeason(clubId: string): Promise<Season | null> {
  // Mock data
  return {
    id: '1',
    club_id: clubId,
    slug: '2025-26-winter',
    name: 'Winter 2025-26',
    registration_opens: '2025-10-01T00:00:00Z',
    registration_closes: '2026-01-15T00:00:00Z',
    season_starts: '2026-01-10',
    season_ends: '2026-03-07',
    club_dues_cents: null,
    max_players: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
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
          <a
            href={club.website_url || '#'}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to {club.name.split(' ')[0]} website
          </a>
        </div>
      </header>
      
      {/* Main content */}
      <main className="py-8 px-4">
        <RegistrationWizard club={club} season={season} />
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
