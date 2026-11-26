import { env } from '../env'
import { AppError } from '../errors'
import { supabase, WEDDING_BUCKET } from '../supabase/client'

/**
 * Uploads with real progress events. supabase-js' upload() has no progress
 * callback, so this talks to the Storage REST endpoint directly with the
 * user's access token (Storage RLS still applies).
 */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  body: Blob,
  contentType: string,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new AppError('Sign in again to upload files.')
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${env.supabaseUrl}/storage/v1/object/${bucket}/${encoded}`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', env.supabaseAnonKey)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.setRequestHeader('cache-control', 'max-age=31536000')
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1)
        resolve(path)
      } else {
        let message = `Upload failed (${xhr.status})`
        try {
          const body = JSON.parse(xhr.responseText) as { message?: string; error?: string }
          message = body.message ?? body.error ?? message
        } catch {
          /* non-JSON body */
        }
        if (/size|too large|exceeded/i.test(message)) message = 'That file is too large.'
        if (/mime|type/i.test(message)) message = 'That file type is not allowed.'
        if (/row-level|policy|Unauthorized/i.test(message)) message = 'You don’t have permission to upload here.'
        reject(new AppError(message))
      }
    }
    xhr.onerror = () => reject(new AppError('Upload failed — check your connection.'))
    xhr.send(body)
  })
}

// ---------------------------------------------------------------- signed URLs
const SIGNED_TTL_SECONDS = 60 * 60 * 6
const cache = new Map<string, { url: string; expires: number }>()

/**
 * Resolves private storage paths to signed URLs in one request. Guests can
 * only sign objects that belong to a published wedding (storage RLS).
 */
export async function signPaths(paths: (string | null | undefined)[]): Promise<Record<string, string>> {
  const now = Date.now()
  const wanted = [...new Set(paths.filter((p): p is string => Boolean(p)))]
  const out: Record<string, string> = {}
  const missing: string[] = []
  for (const p of wanted) {
    const hit = cache.get(p)
    if (hit && hit.expires > now + 60_000) out[p] = hit.url
    else missing.push(p)
  }
  for (let i = 0; i < missing.length; i += 100) {
    const batch = missing.slice(i, i + 100)
    const { data, error } = await supabase.storage.from(WEDDING_BUCKET).createSignedUrls(batch, SIGNED_TTL_SECONDS)
    if (error) throw new AppError('Could not load media.')
    for (const item of data ?? []) {
      if (item.signedUrl && item.path) {
        out[item.path] = item.signedUrl
        cache.set(item.path, { url: item.signedUrl, expires: now + SIGNED_TTL_SECONDS * 1000 })
      }
    }
  }
  return out
}

export { templateAssetUrl } from './publicUrls'

export const weddingFolder = (ownerId: string, weddingId: string) => `${ownerId}/${weddingId}`

export async function removeObjects(paths: (string | null | undefined)[]): Promise<void> {
  const list = paths.filter((p): p is string => Boolean(p))
  if (list.length === 0) return
  const { error } = await supabase.storage.from(WEDDING_BUCKET).remove(list)
  if (error) throw new AppError('Could not delete the file.')
}

/** Deletes every object in a wedding's folder (used before deleting the wedding). */
export async function removeWeddingFolder(ownerId: string, weddingId: string): Promise<void> {
  const root = weddingFolder(ownerId, weddingId)
  const subfolders = ['photos', 'thumbnails', 'videos', 'audio', 'events']
  const all: string[] = []
  for (const sub of subfolders) {
    let offset = 0
    for (;;) {
      const { data, error } = await supabase.storage.from(WEDDING_BUCKET).list(`${root}/${sub}`, { limit: 100, offset })
      if (error) throw new AppError('Could not clean up uploaded files.')
      if (!data || data.length === 0) break
      all.push(...data.filter((f) => f.id).map((f) => `${root}/${sub}/${f.name}`))
      if (data.length < 100) break
      offset += 100
    }
  }
  for (let i = 0; i < all.length; i += 100) {
    await removeObjects(all.slice(i, i + 100))
  }
}
