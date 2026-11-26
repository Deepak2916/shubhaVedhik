import { env } from '@/lib/env'
import { restRpc, restRpcBeacon, restSignPaths } from '@/lib/supabase/rest'
import { invitationDataSchema } from '@/lib/validation/invitation'
import { templateConfigSchema } from '@/lib/validation/template'
import { hydrate, templatePayloadToInvitation, type LoadedInvitation, type TemplatePayload, type WeddingPayload } from './hydrate'

/**
 * Guest-facing data access. Uses the lightweight REST client (no supabase-js)
 * so the public invitation stays small and fast.
 */

const SIGNED_TTL = 60 * 60 * 6

async function signAnon(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const list = [...new Set(paths.filter((p): p is string => Boolean(p)))]
  const out: Record<string, string> = {}
  for (let i = 0; i < list.length; i += 100) {
    const rows = await restSignPaths('wedding-assets', list.slice(i, i + 100), SIGNED_TTL)
    for (const r of rows) if (r.signedURL) out[r.path] = `${env.supabaseUrl}/storage/v1${r.signedURL}`
  }
  return out
}

export async function fetchPublicWedding(slug: string): Promise<LoadedInvitation | null> {
  const payload = await restRpc<WeddingPayload | null>('get_public_wedding', { p_slug: slug })
  return payload ? hydrate(payload, signAnon) : null
}

/** Template demo with its sample wedding. Falls back to bundled presets when Supabase isn't configured. */
export async function fetchTemplatePreview(slug: string, versionId?: string): Promise<LoadedInvitation | null> {
  if (!env.isConfigured) {
    const { TEMPLATE_PRESETS } = await import('@/features/templates/presets/presets')
    const preset = TEMPLATE_PRESETS.find((t) => t.slug === slug)
    if (!preset) return null
    return {
      template: { slug: preset.slug, name: preset.name, config: templateConfigSchema.parse(preset.config), sections: preset.sections },
      data: invitationDataSchema.parse(preset.sample),
    }
  }
  const payload = await restRpc<TemplatePayload | null>('get_template_payload', { p_slug: slug, p_version: versionId ?? null })
  return payload ? templatePayloadToInvitation(payload) : null
}

// ---------------------------------------------------------------- analytics
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function localVisitorId(): string {
  try {
    let id = localStorage.getItem('sv_vid')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('sv_vid', id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

function deviceClass(): 'mobile' | 'tablet' | 'desktop' {
  const touch = window.matchMedia('(pointer: coarse)').matches
  const w = Math.min(window.screen.width, window.screen.height)
  if (touch && w < 600) return 'mobile'
  if (touch) return 'tablet'
  return 'desktop'
}

/**
 * Privacy-conscious visit tracking: a random per-browser id (never leaves the
 * device) hashed with the slug; no IP, no user agent, no cookies.
 */
export async function recordVisit(slug: string, source: 'qr' | 'link'): Promise<void> {
  try {
    const key = `sv_seen_${slug}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    const hash = await sha256(`${slug}:${localVisitorId()}`)
    restRpcBeacon('record_visit', { p_slug: slug, p_source: source, p_device: deviceClass(), p_visitor_hash: hash })
  } catch {
    /* analytics must never break the invitation */
  }
}

export function recordInteraction(slug: string, action: string): void {
  restRpcBeacon('record_interaction', { p_slug: slug, p_action: action })
}
