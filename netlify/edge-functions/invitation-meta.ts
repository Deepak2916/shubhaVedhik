/**
 * Social-preview metadata for /w/:slug.
 *
 * WhatsApp, Facebook, X and iMessage don't run JavaScript, so a pure SPA
 * would show the generic site title for every invitation. This edge function
 * (Netlify, Deno runtime) fetches the published wedding's public metadata via
 * the anon key + get_wedding_meta() RPC and rewrites the block between
 * <!--app-head:start--> and <!--app-head:end--> in index.html.
 *
 * It is the only server-side code in the project, needs no service-role key,
 * and fails open (serves the normal page) on any error.
 */
import type { Context } from 'https://edge.netlify.com'

interface Meta {
  slug: string
  groomName: string
  brideName: string
  date: string | null
  city: string | null
  venueName: string | null
  coverPath: string | null
  templateCover: string | null
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default async function handler(request: Request, context: Context) {
  const response = await context.next()
  try {
    const supabaseUrl = Netlify.env.get('VITE_SUPABASE_URL')
    const anon = Netlify.env.get('VITE_SUPABASE_ANON_KEY')
    const slug = new URL(request.url).pathname.split('/')[2]?.toLowerCase()
    if (!supabaseUrl || !anon || !slug || !/^[a-z0-9-]{3,60}$/.test(slug)) return response
    if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response

    const headers = { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' }
    const metaRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_wedding_meta`, { method: 'POST', headers, body: JSON.stringify({ p_slug: slug }) })
    if (!metaRes.ok) return response
    const meta = (await metaRes.json()) as Meta | null
    if (!meta) return response

    const origin = new URL(request.url).origin
    let image = meta.templateCover ? new URL(meta.templateCover, origin).toString() : `${origin}/demo/photos/fairy-lights.webp`
    if (meta.coverPath) {
      // Signed for 30 days; anon may sign objects of published weddings only.
      const sign = await fetch(`${supabaseUrl}/storage/v1/object/sign/wedding-assets/${meta.coverPath}`, { method: 'POST', headers, body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 30 }) })
      if (sign.ok) {
        const { signedURL } = (await sign.json()) as { signedURL?: string }
        if (signedURL) image = `${supabaseUrl}/storage/v1${signedURL}`
      }
    }

    const couple = `${meta.brideName} & ${meta.groomName}`
    const title = `${couple} — Wedding invitation`
    const description = [`You're invited to celebrate the wedding of ${couple}`, formatDate(meta.date), meta.venueName ?? meta.city].filter(Boolean).join(' · ')
    const url = `${origin}/w/${meta.slug}`
    const tags = [
      `<title>${esc(title)}</title>`,
      `<meta name="description" content="${esc(description)}" />`,
      `<link rel="canonical" href="${esc(url)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="ShubhaVedhik" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(description)}" />`,
      `<meta property="og:url" content="${esc(url)}" />`,
      `<meta property="og:image" content="${esc(image)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(description)}" />`,
      `<meta name="twitter:image" content="${esc(image)}" />`,
    ].join('\n    ')

    const html = (await response.text()).replace(/<!--app-head:start-->[\s\S]*?<!--app-head:end-->/, `<!--app-head:start-->\n    ${tags}\n    <!--app-head:end-->`)
    const out = new Headers(response.headers)
    out.set('cache-control', 'public, max-age=0, s-maxage=300')
    out.delete('content-length')
    return new Response(html, { status: response.status, headers: out })
  } catch {
    return response
  }
}

export const config = { path: '/w/*' }
