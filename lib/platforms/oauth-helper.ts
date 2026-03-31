import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export interface PlatformOAuthConfig {
    clientId: string
    clientSecret: string
    authUrl: string
    tokenUrl: string
    scopes: string[]
}

const CONFIGS: Record<string, PlatformOAuthConfig> = {
    youtube: {
        clientId: process.env.YOUTUBE_CLIENT_ID || '',
        clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    },
    linkedin: {
        clientId: process.env.LINKEDIN_CLIENT_ID || '',
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
        scopes: ['w_member_social', 'r_liteprofile'],
    },
    // Add other platforms as needed
}

export async function initiateOAuth(platform: string, brandId: string) {
    const config = CONFIGS[platform]
    if (!config) throw new Error(`Unsupported platform: ${platform}`)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/oauth/${platform}/callback`

    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scopes.join(' '),
        state: brandId, // Using state to pass brandId
        access_type: 'offline', // For Google/YouTube to get refresh token
        prompt: 'consent',
    })

    return NextResponse.redirect(`${config.authUrl}?${params.toString()}`)
}

export async function handleOAuthCallback(platform: string, request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const brandId = searchParams.get('state')

    if (!code || !brandId) throw new Error('Invalid callback parameters')

    const config = CONFIGS[platform]
    if (!config) throw new Error(`Unsupported platform: ${platform}`)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/oauth/${platform}/callback`

    const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: config.clientId,
            client_secret: config.clientSecret,
        }),
    })

    const tokens = await response.json()
    if (!response.ok) throw new Error(`Failed to exchange token: ${JSON.stringify(tokens)}`)

    const supabase = await createClient()
    await supabase.from('platform_connections').upsert({
        brand_id: brandId,
        platform,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
        is_active: true,
    })

    return NextResponse.redirect(`${baseUrl}/repurpose?success=true`)
}
