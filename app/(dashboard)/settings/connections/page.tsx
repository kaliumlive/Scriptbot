import { createClient } from '@/lib/supabase/server'
import { OAUTH_CONFIGS } from '@/lib/platforms/oauth-config'
import { CheckCircle2, ExternalLink, AlertCircle, ChevronDown, Rocket } from 'lucide-react'
import { disconnectPlatform, initializeDefaultBrand } from './actions'

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; platform?: string; connected?: string; message?: string }>
}) {
  const { error: oauthError, platform: errorPlatform, connected, message: errorMsg } = await searchParams

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
        <p className="text-zinc-500 text-sm mt-1">Link your social accounts to enable autonomous analytics retrieval</p>
      </div>

      {/* Analytics Scope Warning */}
      <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 mb-8 ring-1 ring-indigo-500/30">
        <AlertCircle className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-black text-indigo-300 mb-1.5 uppercase tracking-[0.1em]">Important: Read-Only Analytics</h4>
          <p className="text-xs text-indigo-100/90 leading-relaxed font-medium">
            Platform integrations are currently <strong>Read-Only</strong>. 
            Scriptbot retrieves your performance metrics to power your dashboard, but it 
            <strong> does not have permission to post content</strong> or access private 
            messages on your behalf. All publishing must be handled manually from your drafts.
          </p>
        </div>
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
          <div className="flex-1">
            <p className="font-semibold mb-1">
              {oauthError === 'not_configured' 
                ? `${errorPlatform} Configuration Missing` 
                : `${errorPlatform} Connection Error`}
            </p>
            <div className="opacity-80 space-y-2">
              <p>
                {oauthError === 'not_configured' ? (
                  <>Credentials are not configured for this platform.</>
                ) : (
                  <>{errorMsg || 'An unexpected error occurred during the connection flow.'}</>
                )}
              </p>
              
              {errorPlatform === 'instagram' && oauthError === 'token_exchange_failed' && (
                <div className="mt-4 pt-4 border-t border-red-500/10 space-y-2 text-xs">
                  <p className="font-semibold text-red-300">How to fix this:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Ensure your Instagram is a <strong>Business</strong> or <strong>Creator</strong> account.</li>
                    <li>Link your Instagram account to a <strong>Facebook Page</strong>.</li>
                    <li>Make sure you have <strong>Administrator</strong> access to that Facebook Page.</li>
                    <li>Check that the &quot;Instagram Assets&quot; are enabled in your Facebook Page settings.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!brand && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
          <div className="text-sm text-amber-400">
            Import your brand profile first before connecting platforms.
          </div>
          <form action={initializeDefaultBrand}>
             <button type="submit" className="text-xs flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg transition-colors border border-amber-500/30">
                <Rocket className="w-3.5 h-3.5" />
                Initialize Profile
             </button>
          </form>
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

                <div className="flex items-center gap-2">
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
                  {isConnected && (
                    <form action={disconnectPlatform.bind(null, p.platform)}>
                      <button
                        type="submit"
                        className="shrink-0 text-xs px-3.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/30 transition-all font-medium"
                      >
                        Disconnect
                      </button>
                    </form>
                  )}
                </div>
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
