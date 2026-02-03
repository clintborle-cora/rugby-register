import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Download,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Image,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ clubSlug: string }>
  searchParams: Promise<{ status?: string; division?: string; search?: string }>
}

const STATUS_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Clock },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: FileText },
  pending_verification: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  verified: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  complete: { label: 'Complete', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
}

async function getRegistrations(
  clubSlug: string,
  filters: { status?: string; division?: string; search?: string }
) {
  const supabase = await createClient()

  // Get club
  const { data: club } = await supabase
    .from('clubs')
    .select('id, settings')
    .eq('slug', clubSlug)
    .single()

  if (!club) return { registrations: [], divisions: [] }

  const currentSeason = club.settings?.current_season || '2025-26-winter'
  const divisions = club.settings?.divisions || []

  // Build query
  let query = supabase
    .from('registrations')
    .select(`
      id,
      status,
      division,
      payment_amount_cents,
      payment_date,
      created_at,
      player:players(
        id,
        first_name,
        last_name,
        date_of_birth,
        headshot_url,
        dob_document_url,
        guardian:guardians(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      )
    `)
    .eq('club_id', club.id)
    .eq('season', currentSeason)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.division) {
    query = query.eq('division', filters.division)
  }

  const { data: registrations } = await query

  // Apply search filter (client-side for now)
  let filtered = registrations || []
  if (filters.search) {
    const search = filters.search.toLowerCase()
    filtered = filtered.filter((r: any) => {
      const playerName = `${r.player?.first_name} ${r.player?.last_name}`.toLowerCase()
      const guardianName = `${r.player?.guardian?.first_name} ${r.player?.guardian?.last_name}`.toLowerCase()
      const guardianEmail = r.player?.guardian?.email?.toLowerCase() || ''
      return (
        playerName.includes(search) ||
        guardianName.includes(search) ||
        guardianEmail.includes(search)
      )
    })
  }

  return { registrations: filtered, divisions }
}

export default async function RegistrationsPage({ params, searchParams }: PageProps) {
  const { clubSlug } = await params
  const filters = await searchParams
  const { registrations, divisions } = await getRegistrations(clubSlug, filters)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registrations</h2>
          <p className="text-gray-600">{registrations.length} registrations found</p>
        </div>
        <Link href={`/admin/${clubSlug}/registrations/export`}>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={filters.search}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            name="status"
            defaultValue={filters.status}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="paid">Paid</option>
            <option value="submitted">Submitted</option>
            <option value="pending_verification">Pending Verification</option>
            <option value="complete">Complete</option>
          </select>
          <select
            name="division"
            defaultValue={filters.division}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Divisions</option>
            {divisions.map((div: string) => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
          <Button type="submit">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </form>
      </Card>

      {/* Registrations table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guardian
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Division
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Docs
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No registrations found
                  </td>
                </tr>
              ) : (
                registrations.map((reg: any) => {
                  const statusBadge = STATUS_BADGES[reg.status] || STATUS_BADGES.draft
                  const hasHeadshot = !!reg.player?.headshot_url
                  const hasDobDoc = !!reg.player?.dob_document_url
                  const docsComplete = hasHeadshot && hasDobDoc

                  return (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">
                          {reg.player?.first_name} {reg.player?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          DOB: {reg.player?.date_of_birth}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-gray-900">
                          {reg.player?.guardian?.first_name} {reg.player?.guardian?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reg.player?.guardian?.email}
                        </div>
                        {reg.player?.guardian?.phone && (
                          <div className="text-sm text-gray-500">
                            {reg.player?.guardian?.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {reg.division}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}
                        >
                          <statusBadge.icon className="h-3 w-3" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded ${hasHeadshot ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                            title={hasHeadshot ? 'Headshot uploaded' : 'No headshot'}
                          >
                            <Image className="h-4 w-4" />
                          </span>
                          <span
                            className={`p-1 rounded ${hasDobDoc ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                            title={hasDobDoc ? 'DOB document uploaded' : 'No DOB document'}
                          >
                            <FileText className="h-4 w-4" />
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {reg.payment_amount_cents ? (
                          <div>
                            <div className="font-medium text-green-600">
                              ${(reg.payment_amount_cents / 100).toFixed(2)}
                            </div>
                            {reg.payment_date && (
                              <div className="text-xs text-gray-500">
                                {new Date(reg.payment_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
