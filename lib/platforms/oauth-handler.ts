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

    const clientId = process.env[config.envClientId]
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

    const clientId = process.env[config.envClientId] ?? ''
    const clientSecret = process.env[config.envClientSecret] ?? ''
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

      // Special handling for Instagram to get the Business Account ID
      if (platform === 'instagram') {
        // 1. Get long-lived token (recommended for server-side)
        const longLivedRes = await fetch(
          `https://graph.facebook.com/v19.0/oauth/access_token?` +
          new URLSearchParams({
            grant_type: 'fb_exchange_token',
            client_id: clientId,
            client_secret: clientSecret,
            fb_exchange_token: accessToken,
          })
        )
        const longLivedData = await longLivedRes.json()
        if (longLivedData.access_token) {
          accessToken = longLivedData.access_token
        }

        // 2. Get pages managed by the user
        const pagesRes = await fetch(
          `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
        )
        const pagesData = await pagesRes.json()
        
        const debugLogs: Array<{ pageId?: string; pageName?: string; igData?: unknown; error?: string; pagesData?: unknown }> = []

        if (pagesData.data && pagesData.data.length > 0) {
          console.log(`[Instagram OAuth] Found ${pagesData.data.length} Facebook Pages. Searching for linked IG Business Account...`)
          // Find the first page that has an instagram_business_account
          for (const page of pagesData.data) {
            const pageToken = page.access_token || accessToken
            const igRes = await fetch(
              `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account,connected_instagram_account,name&access_token=${pageToken}`
            )
            const igData = await igRes.json()
            console.log(`[Instagram OAuth] Checking Page "${igData.name}" (${page.id})...`)
            
            debugLogs.push({ pageId: page.id, pageName: page.name || igData.name, igData })

            const igId = igData.instagram_business_account?.id || igData.connected_instagram_account?.id
            
            if (igId) {
              instagramBusinessId = igId
              pageId = page.id
              console.log(`[Instagram OAuth] Found linked IG Business ID: ${instagramBusinessId}`)
              break
            } else {
              console.log(`[Instagram OAuth] Page "${igData.name}" has no linked Instagram Business Account.`)
            }
          }
        } else {
          console.error('[Instagram OAuth] No Facebook Pages found for this user.')
          debugLogs.push({ error: 'No Facebook pages found in me/accounts', pagesData })
        }

        const supabase = await createClient()

        if (!instagramBusinessId) {
          interface FacebookPage { id: string; name: string }
          console.error('[Instagram OAuth] No Business Account found for pages:', pagesData.data?.map((p: FacebookPage) => `${p.name} (${p.id})`))
          
          await supabase.from('agent_logs').insert({
            agent_name: 'oauth_debug',
            level: 'error',
            message: 'IG OAuth Failure - Data Dump',
            metadata: { debugLogs, pagesData }
          })
          
          throw new Error('No Instagram Business Account linked to the selected Facebook Page. Please ensure your Instagram account is a Professional account (Business or Creator) and linked to a Facebook Page.')
        }

        console.log('[Instagram OAuth] Successfully matched IG Business ID:', instagramBusinessId)
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
