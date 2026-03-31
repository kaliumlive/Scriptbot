'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Kanban,
  Video,
  Calendar,
  BarChart3,
  Settings,
  Zap,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/repurpose', label: 'Repurpose', icon: Video },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/brands', label: 'Brands', icon: Zap },
  { href: '/settings/connections', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      <aside className="w-52 shrink-0 border-r border-white/[0.06] flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-100 tracking-tight">Scriptbot</span>
          </div>
          <span className="ml-auto text-[9px] font-medium text-violet-400 bg-violet-400/10 border border-violet-400/20 rounded px-1.5 py-0.5 tracking-wide">
            BETA
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {navItems.map(item => {
            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                  active
                    ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
                )}
              >
                <item.icon className={cn('w-4 h-4 shrink-0', active ? 'text-violet-400' : '')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-2 border-t border-white/[0.06]">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.04] transition-all w-full border border-transparent"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
