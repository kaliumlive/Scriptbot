'use client'

import { useState } from 'react'
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

interface TrendItem {
  topic: string
  angle?: string
  format?: string
  why_trending?: string
}

interface TrendReport {
  id: string
  platform: string
  niche: string
  trends: TrendItem[]
  created_at: string
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'IG',
  tiktok: 'TT',
  youtube: 'YT',
  twitter: 'X',
  linkedin: 'LI',
}

export default function TrendReports({ reports }: { reports: TrendReport[] }) {
  const [open, setOpen] = useState(false)

  // Group by platform, keep most recent per platform
  const byPlatform: Record<string, TrendReport> = {}
  for (const r of reports) {
    if (!byPlatform[r.platform]) byPlatform[r.platform] = r
  }
  const platforms = Object.values(byPlatform)

  return (
    <div className="px-6 pt-4 max-w-5xl mx-auto">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-3"
      >
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <span className="font-medium text-zinc-300">Trending now</span>
        <span className="text-zinc-600">·</span>
        <span>{platforms.map(p => PLATFORM_LABELS[p.platform] || p.platform).join(', ')}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
      </button>

      {open && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {platforms.map(report => (
            <div key={report.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {report.platform}
                </span>
                <span className="text-xs text-zinc-600">
                  {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <ul className="space-y-2.5">
                {(report.trends as TrendItem[]).slice(0, 5).map((trend, i) => (
                  <li key={i} className="group">
                    <p className="text-sm text-zinc-200 font-medium leading-snug">{trend.topic}</p>
                    {trend.angle && (
                      <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{trend.angle}</p>
                    )}
                    {trend.why_trending && (
                      <p className="text-xs text-zinc-600 mt-0.5 leading-snug hidden group-hover:block">{trend.why_trending}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
