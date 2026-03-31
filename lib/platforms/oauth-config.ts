export interface OAuthPlatformConfig {
  platform: string
  label: string
  envClientId: string
  envClientSecret: string
  authUrl: string
  tokenUrl: string
  scopes: string[]
  scopeJoin: ',' | ' '
  extraAuthParams?: Record<string, string>
  color: string
  badge: string
  note: string
  setupGuide: { envVar: string; where: string }[]
}

export const OAUTH_CONFIGS: Record<string, OAuthPlatformConfig> = {
  instagram: {
    platform: 'instagram',
    label: 'Instagram Business',
    envClientId: 'INSTAGRAM_APP_ID',
    envClientSecret: 'INSTAGRAM_APP_SECRET',
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    scopes: [
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
      'public_profile'
    ],
    scopeJoin: ',',
    color: 'from-pink-500 to-rose-500',
    badge: 'IG',
    note: 'Requires Instagram Business account connected to a Facebook Page',
    setupGuide: [
      { envVar: 'INSTAGRAM_APP_ID', where: 'Meta Developer Console → Your App → Settings → Basic → App ID' },
      { envVar: 'INSTAGRAM_APP_SECRET', where: 'Meta Developer Console → Your App → Settings → Basic → App Secret' },
    ],
  },
  tiktok: {
    platform: 'tiktok',
    label: 'TikTok',
    envClientId: 'TIKTOK_CLIENT_ID',
    envClientSecret: 'TIKTOK_CLIENT_SECRET',
    authUrl: 'https://www.tiktok.com/v2/auth/authorize',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
    scopes: ['user.info.basic', 'video.upload', 'video.publish'],
    scopeJoin: ',',
    color: 'from-zinc-100 to-zinc-300',
    badge: 'TT',
    note: 'Content posting API',
    setupGuide: [
      { envVar: 'TIKTOK_CLIENT_ID', where: 'TikTok Developer Portal → App Detail → Client Key' },
      { envVar: 'TIKTOK_CLIENT_SECRET', where: 'TikTok Developer Portal → App Detail → Client Secret' },
    ],
  },
  linkedin: {
    platform: 'linkedin',
    label: 'LinkedIn',
    envClientId: 'LINKEDIN_CLIENT_ID',
    envClientSecret: 'LINKEDIN_CLIENT_SECRET',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['openid', 'profile', 'w_member_social'],
    scopeJoin: ' ',
    color: 'from-blue-600 to-blue-700',
    badge: 'LI',
    note: 'Personal profile or company page',
    setupGuide: [
      { envVar: 'LINKEDIN_CLIENT_ID', where: 'linkedin.com/developers → Your App → Auth → Client ID' },
      { envVar: 'LINKEDIN_CLIENT_SECRET', where: 'linkedin.com/developers → Your App → Auth → Primary Client Secret' },
    ],
  },
  youtube: {
    platform: 'youtube',
    label: 'YouTube',
    envClientId: 'YOUTUBE_CLIENT_ID',
    envClientSecret: 'YOUTUBE_CLIENT_SECRET',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    scopeJoin: ' ',
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
    color: 'from-red-500 to-red-600',
    badge: 'YT',
    note: 'Upload + auto-pull for Voice Learner',
    setupGuide: [
      { envVar: 'YOUTUBE_CLIENT_ID', where: 'console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client IDs' },
      { envVar: 'YOUTUBE_CLIENT_SECRET', where: 'console.cloud.google.com → APIs & Services → Credentials → Client Secret' },
    ],
  },
}
