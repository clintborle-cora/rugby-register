import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/check-admin'
import { signOut } from '@/lib/actions/auth'
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'

async function getClub(slug: string) {
  const supabase = await createClient()
  const { data: club } = await supabase
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .single()
  return club
}

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ clubSlug: string }>
}

export default async function AdminLayout({ children, params }: LayoutProps) {
  const { clubSlug } = await params
  const club = await getClub(clubSlug)

  if (!club) {
    notFound()
  }

  const admin = await requireAdmin(clubSlug)

  const navItems = [
    {
      label: 'Dashboard',
      href: `/admin/${clubSlug}`,
      icon: LayoutDashboard,
    },
    {
      label: 'Registrations',
      href: `/admin/${clubSlug}/registrations`,
      icon: Users,
    },
    {
      label: 'Payments',
      href: `/admin/${clubSlug}/payments`,
      icon: FileText,
    },
  ]

  if (admin.role === 'owner' || admin.role === 'admin') {
    navItems.push({
      label: 'Settings',
      href: `/admin/${clubSlug}/settings`,
      icon: Settings,
    })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-4">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: club.primary_color || '#ef4444' }}
              >
                {club.name[0]}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{club.name}</h1>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {admin.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] hidden md:block">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <item.icon className="h-5 w-5 text-gray-500" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <Link
              href={`/${clubSlug}`}
              className="text-sm text-primary-600 hover:underline"
            >
              ← View registration form
            </Link>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
          <nav className="flex justify-around py-2">
            {navItems.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-1 text-gray-600"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
