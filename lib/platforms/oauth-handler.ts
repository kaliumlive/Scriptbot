import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OAUTH_CONFIGS } from './oauth-config'
import { resolveAppOriginFromRequest } from '@/lib/utils/app-origin'

function getAppUrl(request: NextRequest) {
  return resolveAppOriginFromRequest(request)
}

export function createInitiateHandler(platform: string) {
  return async function GET(request: NextRequest) {
    const config = OAUTH_CONFIGS[platform]
    if (!config) return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })

    const clientId = process.env[config.envClientId]?.trim()
    if (!clientId) {
      const url = new URL('/settings/connections', getAppUrl(request))
      url.searchParams.set('error', 'not_configured')
      url.searchParams.set('platform', platform)
      return NextResponse.redirect(url)
    }

    const brandId = request.nextUrl.searchParams.get('brand_id') ?? ''
    const appUrl = getAppUrl(request)
    const redirectUri = `${appUrl}/api/oauth/${platform}/callback`

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: config.scopes.join(config.scopeJoin),
      response_type: 'code',
      state: JSON.stringify({ brandId }),
      ...(config.extraAuthParams ?? {}),
    })

    return NextResponse.redirect(`${config.authUrl}?${params.toString()}`)
  }
}

export function createCallbackHandler(platform: string) {
  return async function GET(request: NextRequest) {
    const config = OAUTH_CONFIGS[platform]
    if (!config) return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })

    const appUrl = getAppUrl(request)
    const { searchParams } = request.nextUrl
    const code = searchParams.get('code')
    const stateRaw = searchParams.get('state') ?? '{}'
    const error = searchParams.get('error')

    if (error) {
      const url = new URL('/settings/connections', appUrl)
      url.searchParams.set('error', error)
      url.searchParams.set('platform', platform)
      return NextResponse.redirect(url)
    }

    if (!code) {
      const url = new URL('/settings/connections', appUrl)
      url.searchParams.set('error', 'no_code')
      url.searchParams.set('platform', platform)
      return NextResponse.redirect(url)
    }

    let brandId = ''
    try {
      const state = JSON.parse(stateRaw)
      brandId = state.brandId ?? ''
    } catch {}

    const clientId = (process.env[config.envClientId] ?? '').trim()
    const clientSecret = (process.env[config.envClientSecret] ?? '').trim()
    const redirectUri = `${appUrl}/api/oauth/${platform}/callback`

    try {
      const resp = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      })

      const tokens = await resp.json()
      if (!resp.ok) throw new Error(JSON.stringify(tokens))

      let accessToken = tokens.access_token
      let instagramBusinessId: string | null = null
      let pageId: string | null = null

      // Special handling for Instagram — uses new Instagram Business Login API
      // Works directly with Business AND Creator accounts, no Facebook Page lookup needed
      if (platform === 'instagram') {
        // 1. Exchange short-lived token for long-lived token via Instagram Graph API
        const longLivedRes = await fetch(
          `https://graph.instagram.com/access_token?` +
          new URLSearchParams({
            grant_type: 'ig_exchange_token',
            client_id: clientId,
            client_secret: clientSecret,
            access_token: accessToken,
          })
        )
        const longLivedData = await longLivedRes.json()
        if (longLivedData.access_token) {
          accessToken = longLivedData.access_token
        }

        // 2. Get Instagram user ID directly (no Facebook Page intermediary)
        const meRes = await fetch(
          `https://graph.instagram.com/v19.0/me?fields=id,username,account_type&access_token=${accessToken}`
        )
        const meData = await meRes.json()
        console.log('[Instagram OAuth] IG me response:', JSON.stringify(meData))

        if (meData.id) {
          instagramBusinessId = meData.id
          console.log(`[Instagram OAuth] Connected IG account: @${meData.username} (${meData.account_type}) ID: ${instagramBusinessId}`)
        } else {
          throw new Error(`Could not retrieve Instagram account. Response: ${JSON.stringify(meData)}`)
        }
      }

      console.log(`[OAuth] Finalizing ${platform} connection for brand:`, brandId)
      const supabase = await createClient()
      
      const { error: upsertError } = await supabase.from('platform_connections').upsert({
        brand_id: brandId,
        platform,
        access_token: accessToken,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
        external_account_id: instagramBusinessId || null,
        external_page_id: pageId || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'brand_id,platform' })

      if (upsertError) {
        console.error('[OAuth] Supabase Upsert Error:', upsertError)
        throw new Error(`Failed to save connection: ${upsertError.message}`)
      }

      console.log(`[OAuth] Successfully connected ${platform}`)

      const url = new URL('/settings/connections', appUrl)
      url.searchParams.set('connected', platform)
      return NextResponse.redirect(url)
    } catch (err: unknown) {
      console.error('OAuth Error:', err instanceof Error ? err.message : String(err))
      const url = new URL('/settings/connections', appUrl)
      url.searchParams.set('error', 'token_exchange_failed')
      url.searchParams.set('platform', platform)
      url.searchParams.set('message', err instanceof Error ? err.message : 'Unknown error')
      return NextResponse.redirect(url)
    }
  }
}
