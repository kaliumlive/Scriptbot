import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

function normalizeOrigin(rawUrl: string | null | undefined) {
  if (!rawUrl) {
    return null
  }

  try {
    return new URL(rawUrl.trim()).origin
  } catch {
    return null
  }
}

function isLocalHost(hostname: string | null | undefined) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function preferRequestOrigin(configuredOrigin: string | null, requestOrigin: string) {
  if (!configuredOrigin) {
    return requestOrigin
  }

  try {
    const configured = new URL(configuredOrigin)
    const request = new URL(requestOrigin)

    if (isLocalHost(configured.hostname) && !isLocalHost(request.hostname)) {
      return request.origin
    }

    return configured.origin
  } catch {
    return requestOrigin
  }
}

export function resolveAppOriginFromRequest(request: NextRequest) {
  const configuredOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL)
  return preferRequestOrigin(configuredOrigin, request.nextUrl.origin)
}

export async function resolveAppOriginFromHeaders() {
  const headerStore = await headers()
  const forwardedHost = headerStore.get('x-forwarded-host')
  const host = forwardedHost || headerStore.get('host')
  const proto =
    headerStore.get('x-forwarded-proto') ||
    (host && !isLocalHost(host.split(':')[0]) ? 'https' : 'http')

  const requestOrigin = host ? `${proto}://${host}` : 'http://localhost:3000'
  const configuredOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL)

  return preferRequestOrigin(configuredOrigin, requestOrigin)
}

export function hasRealSupabaseServiceRoleKey() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  return Boolean(serviceRoleKey && anonKey && serviceRoleKey !== anonKey)
}
