'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import {
  LayoutDashboard,
  Kanban,
  Video,
  Calendar,
  BarChart3,
  Settings,
  Zap,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ideate',    label: 'Ideate',    icon: Zap },
  { href: '/pipeline',  label: 'Pipeline',  icon: Kanban },
  { href: '/repurpose', label: 'Repurpose', icon: Video },
  { href: '/calendar',  label: 'Calendar',  icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/brands',    label: 'Brand',     icon: User },
  { href: '/settings/connections', label: 'Connect', icon: Settings },
]

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AgentSidebar from '@/components/dashboard/AgentSidebar'

function SuspendedAgentSidebar() {
  const searchParams = useSearchParams()
  const urlBrandId = searchParams.get('brandId')
  const [brandId, setBrandId] = useState<string | null>(urlBrandId)

  useEffect(() => {
    if (urlBrandId) return
    const fetchBrand = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('brands').select('id').limit(1)
      if (data?.[0]) setBrandId(data[0].id)
    }
    fetchBrand()
  }, [urlBrandId])

  if (!brandId) return null
  return <AgentSidebar brandId={brandId} />
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      <aside className="w-[200px] shrink-0 border-r border-white/[0.05] flex flex-col">
        {/* Logo */}
        <div className="h-[56px] flex items-center px-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-md shadow-violet-900/40 shrink-0">
              <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-zinc-100 tracking-tight font-display">Scriptbot</span>
          </div>
          <span className="text-[9px] font-semibold text-violet-400/70 bg-violet-400/10 rounded px-1.5 py-0.5 tracking-widest shrink-0">
            BETA
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const active =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-100 cursor-pointer',
                  active
                    ? 'bg-violet-500/[0.12] text-violet-300 border border-violet-500/20'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
                )}
              >
                <item.icon className={cn('w-[15px] h-[15px] shrink-0', active ? 'text-violet-400' : 'text-zinc-600')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-violet-300">K</span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-zinc-400 truncate">@kalium.wav</p>
              <p className="text-[10px] text-zinc-700">music producer</p>
            </div>
          </div>
        </div>

      </aside>

      <main className="flex-1 overflow-auto min-w-0">{children}</main>

      {/* Global Agency Sidebar */}
      <Suspense fallback={null}>
        <SuspendedAgentSidebar />
      </Suspense>
    </div>
  )
}
