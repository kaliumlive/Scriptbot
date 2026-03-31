import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OAUTH_CONFIGS } from '@/lib/platforms/oauth-config'
import { CheckCircle2, ExternalLink, AlertCircle, ChevronDown } from 'lucide-react'

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; platform?: string; connected?: string }>
}) {
  const { error: oauthError, platform: errorPlatform, connected } = await searchParams

  const supabase = await createClient()
  // Auth disabled — fetch all brands
  const { data: brands } = await supabase.from('brands').select('id, name').limit(1)
  const brand = brands?.[0]

  const connections = brand
    ? (await supabase.from('platform_connections').select('*').eq('brand_id', brand.id)).data ?? []
    : []

  const connectedMap = Object.fromEntries(
    connections.filter((c: { is_active: boolean }) => c.is_active).map((c: { platform: string }) => [c.platform, true])
  )

  // Check which platforms have credentials configured
  const configuredMap = Object.fromEntries(
    Object.entries(OAUTH_CONFIGS).map(([key, cfg]) => [key, !!process.env[cfg.envClientId]])
  )

  const platforms = Object.values(OAUTH_CONFIGS)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-50 tracking-tight">Connections</h1>
        <p className="text-zinc-500 text-sm mt-1">Link your social accounts so agents can post on your behalf</p>
      </div>

      {/* OAuth success toast */}
      {connected && (
        <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="capitalize">{connected}</span> connected successfully.
        </div>
      )}

      {/* OAuth error toast */}
      {oauthError && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            {oauthError === 'not_configured' ? (
              <>
                <span className="font-medium capitalize">{errorPlatform}</span> credentials are not configured.{' '}
                <span className="text-zinc-500">See setup guide below.</span>
              </>
            ) : oauthError === 'token_exchange_failed' ? (
              <>Token exchange failed for <span className="font-medium capitalize">{errorPlatform}</span>. Check your client secret.</>
            ) : (
              <>OAuth error: {oauthError}</>
            )}
          </div>
        </div>
      )}

      {!brand && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-amber-400">
          Import your brand profile first before connecting platforms.
        </div>
      )}

      <div className="space-y-3">
        {platforms.map(p => {
          const isConnected = connectedMap[p.platform]
          const isConfigured = configuredMap[p.platform]
          const hasError = oauthError && errorPlatform === p.platform

          return (
            <div
              key={p.platform}
              className={`rounded-xl border transition-colors ${
                isConnected
                  ? 'bg-emerald-500/[0.04] border-emerald-500/20'
                  : hasError
                    ? 'bg-red-500/[0.04] border-red-500/20'
                    : 'bg-white/[0.02] border-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Platform badge */}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shrink-0 shadow-lg`}>
                  <span className="text-white text-xs font-bold">{p.badge}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">{p.label}</span>
                    {isConnected && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">
                        connected
                      </span>
                    )}
                    {!isConfigured && !isConnected && (
                      <span className="text-[10px] text-zinc-600 bg-zinc-800 rounded-full px-2 py-0.5">
                        setup required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mt-0.5">{p.note}</p>
                </div>

                <a
                  href={brand ? `/api/oauth/${p.platform}?brand_id=${brand.id}` : '#'}
                  className={`shrink-0 text-xs px-3.5 py-1.5 rounded-lg border font-medium transition-all ${
                    !brand
                      ? 'text-zinc-700 border-zinc-800 cursor-not-allowed pointer-events-none'
                      : isConnected
                        ? 'text-zinc-400 border-zinc-700 hover:border-zinc-600 hover:text-zinc-300'
                        : isConfigured
                          ? 'text-zinc-900 bg-zinc-100 border-zinc-100 hover:bg-white'
                          : 'text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400'
                  }`}
                >
                  {isConnected ? 'Reconnect' : 'Connect'}
                </a>
              </div>

              {/* Setup guide (collapsed accordion) — show when not configured */}
              {!isConfigured && (
                <details className="group">
                  <summary className="flex items-center gap-2 px-4 pb-3 text-xs text-zinc-600 hover:text-zinc-400 cursor-pointer select-none list-none transition-colors">
                    <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                    Setup guide
                  </summary>
                  <div className="px-4 pb-4 pt-0 border-t border-white/[0.04] space-y-3">
                    <p className="text-xs text-zinc-600 pt-3">
                      Add these to your <code className="text-zinc-400 bg-white/[0.05] px-1 py-0.5 rounded text-[11px]">.env.local</code> file:
                    </p>
                    {p.setupGuide.map(g => (
                      <div key={g.envVar}>
                        <code className="text-[11px] text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded px-2 py-1 block font-mono">
                          {g.envVar}=your_value_here
                        </code>
                        <p className="text-[11px] text-zinc-600 mt-1 pl-1">{g.where}</p>
                      </div>
                    ))}
                    <p className="text-[11px] text-zinc-700 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Add <code className="text-zinc-500 mx-0.5">{process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/{p.platform}/callback</code> as your OAuth redirect URI
                    </p>
                  </div>
                </details>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs text-zinc-700 mt-6 text-center">
        Tokens are stored encrypted in your Supabase database and never leave your deployment.
      </p>
    </div>
  )
}
