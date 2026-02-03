import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ clubSlug: string }>
}

const STATUS_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-700', icon: Clock },
  succeeded: { label: 'Succeeded', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-amber-100 text-amber-700', icon: DollarSign },
}

async function getPayments(clubSlug: string) {
  const supabase = await createClient()

  // Get club
  const { data: club } = await supabase
    .from('clubs')
    .select('id')
    .eq('slug', clubSlug)
    .single()

  if (!club) return { payments: [], totals: { revenue: 0, count: 0 } }

  // Get payments
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      registration:registrations(
        division,
        player:players(
          first_name,
          last_name
        )
      ),
      guardian:guardians(
        first_name,
        last_name,
        email
      )
    `)
    .eq('club_id', club.id)
    .order('created_at', { ascending: false })

  // Calculate totals
  const totals = {
    revenue: (payments || []).reduce((sum: number, p: any) =>
      p.status === 'succeeded' ? sum + (p.total_amount_cents || 0) : sum, 0
    ),
    count: (payments || []).filter((p: any) => p.status === 'succeeded').length,
  }

  return { payments: payments || [], totals }
}

export default async function PaymentsPage({ params }: PageProps) {
  const { clubSlug } = await params
  const { payments, totals } = await getPayments(clubSlug)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
        <p className="text-gray-600">Payment history and revenue</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                ${(totals.revenue / 100).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totals.count}</p>
              <p className="text-sm text-gray-500">Successful Payments</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guardian
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment: any) => {
                  const statusBadge = STATUS_BADGES[payment.status] || STATUS_BADGES.pending
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {new Date(payment.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(payment.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">
                          {payment.registration?.player?.first_name}{' '}
                          {payment.registration?.player?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.registration?.division}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-gray-900">
                          {payment.guardian?.first_name} {payment.guardian?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.guardian?.email}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">
                          ${(payment.total_amount_cents / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Club: ${(payment.club_portion_cents / 100).toFixed(2)} |
                          USA Rugby: ${(payment.usa_rugby_portion_cents / 100).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}
                        >
                          <statusBadge.icon className="h-3 w-3" />
                          {statusBadge.label}
                        </span>
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
