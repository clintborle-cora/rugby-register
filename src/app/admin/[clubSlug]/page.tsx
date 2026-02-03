import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import {
  Users,
  DollarSign,
  FileCheck,
  Clock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ clubSlug: string }>
}

async function getStats(clubSlug: string) {
  const supabase = await createClient()

  // Get club
  const { data: club } = await supabase
    .from('clubs')
    .select('id, settings')
    .eq('slug', clubSlug)
    .single()

  if (!club) return null

  const currentSeason = club.settings?.current_season || '2025-26-winter'

  // Get registration stats
  const { data: registrations } = await supabase
    .from('registrations')
    .select('id, status, division, payment_amount_cents')
    .eq('club_id', club.id)
    .eq('season', currentSeason)

  const stats = {
    totalRegistrations: registrations?.length || 0,
    paid: registrations?.filter(r => r.status === 'paid' || r.status === 'complete').length || 0,
    pending: registrations?.filter(r => r.status === 'draft').length || 0,
    byDivision: {} as Record<string, number>,
    totalRevenue: 0,
  }

  registrations?.forEach(reg => {
    // Count by division
    stats.byDivision[reg.division] = (stats.byDivision[reg.division] || 0) + 1
    // Sum revenue
    if (reg.payment_amount_cents) {
      stats.totalRevenue += reg.payment_amount_cents
    }
  })

  return stats
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { clubSlug } = await params
  const stats = await getStats(clubSlug)

  if (!stats) {
    return <div>Club not found</div>
  }

  const statCards = [
    {
      label: 'Total Registrations',
      value: stats.totalRegistrations,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Paid',
      value: stats.paid,
      icon: FileCheck,
      color: 'bg-green-500',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'bg-amber-500',
    },
    {
      label: 'Revenue',
      value: `$${(stats.totalRevenue / 100).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600">Overview of your club&apos;s registrations</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Division breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">By Division</h3>
        {Object.keys(stats.byDivision).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(stats.byDivision)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([division, count]) => (
                <div key={division} className="flex items-center justify-between">
                  <span className="text-gray-700">{division}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${(count / stats.totalRegistrations) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500">No registrations yet</p>
        )}
      </Card>

      {/* Quick actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href={`/admin/${clubSlug}/registrations`}
            className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">View Registrations</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
          <Link
            href={`/admin/${clubSlug}/registrations?status=draft`}
            className="flex items-center justify-between p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-700">
                {stats.pending} Pending Registrations
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-400" />
          </Link>
        </div>
      </Card>
    </div>
  )
}
