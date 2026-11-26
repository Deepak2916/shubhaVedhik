/**
 * Minimal anonymous REST client for the guest-facing invitation pages.
 * Guests never sign in, so loading the full supabase-js (auth, realtime,
 * storage clients) would cost ~50 KB gzip for nothing. Everything here goes
 * through the same RLS / SECURITY DEFINER rules as the full client.
 */
import { env } from '../env'
import { AppError } from '../errors'

const headers = () => ({ apikey: env.supabaseAnonKey, Authorization: `Bearer ${env.supabaseAnonKey}`, 'Content-Type': 'application/json' })

export async function restRpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${env.supabaseUrl}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(), body: JSON.stringify(args) })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string }
    throw new AppError(body.message ?? `Request failed (${res.status})`)
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

/** Fire-and-forget RPC (analytics); never throws. */
export function restRpcBeacon(fn: string, args: Record<string, unknown>): void {
  void fetch(`${env.supabaseUrl}/rest/v1/rpc/${fn}`, { method: 'POST', headers: headers(), body: JSON.stringify(args), keepalive: true }).catch(() => undefined)
}

/** Signs private storage paths as the anonymous role (allowed only for published weddings). */
export async function restSignPaths(bucket: string, paths: string[], expiresIn: number): Promise<{ path: string; signedURL: string | null }[]> {
  if (paths.length === 0) return []
  const res = await fetch(`${env.supabaseUrl}/storage/v1/object/sign/${bucket}`, { method: 'POST', headers: headers(), body: JSON.stringify({ paths, expiresIn }) })
  if (!res.ok) throw new AppError('Could not load media.')
  return (await res.json()) as { path: string; signedURL: string | null }[]
}

export const storageBase = () => `${env.supabaseUrl}/storage/v1`
