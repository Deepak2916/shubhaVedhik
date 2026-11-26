/**
 * Client-side media pipeline: content sniffing (never trust extensions),
 * image optimisation to WebP display + thumbnail sizes, video poster frames.
 */

export type SniffedKind = 'image' | 'video' | 'audio'

export interface Sniffed {
  kind: SniffedKind
  mime: string
  ext: string
}

export const LIMITS = {
  imageInputBytes: 25 * 1024 * 1024,
  videoBytes: 150 * 1024 * 1024,
  audioBytes: 20 * 1024 * 1024,
  displayEdge: 1600,
  thumbEdge: 640,
}

const ascii = (b: Uint8Array, start: number, len: number) =>
  String.fromCharCode(...b.slice(start, start + len))

/** Identifies a file from its first bytes. Returns null for anything unsupported. */
export async function sniffFile(file: Blob): Promise<Sniffed | null> {
  const b = new Uint8Array(await file.slice(0, 32).arrayBuffer())
  if (b.length < 12) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { kind: 'image', mime: 'image/jpeg', ext: 'jpg' }
  if (b[0] === 0x89 && ascii(b, 1, 3) === 'PNG') return { kind: 'image', mime: 'image/png', ext: 'png' }
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return { kind: 'image', mime: 'image/webp', ext: 'webp' }
  if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WAVE') return { kind: 'audio', mime: 'audio/wav', ext: 'wav' }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) {
    return file.type.startsWith('audio') ? { kind: 'audio', mime: 'audio/webm', ext: 'weba' } : { kind: 'video', mime: 'video/webm', ext: 'webm' }
  }
  if (ascii(b, 4, 4) === 'ftyp') {
    const brand = ascii(b, 8, 4)
    if (/^(heic|heix|hevc|mif1|msf1)$/.test(brand)) return null // HEIC: ask for JPEG instead
    if (/^M4A|^M4B/.test(brand)) return { kind: 'audio', mime: 'audio/mp4', ext: 'm4a' }
    return { kind: 'video', mime: 'video/mp4', ext: 'mp4' }
  }
  if (ascii(b, 0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return { kind: 'audio', mime: 'audio/mpeg', ext: 'mp3' }
  if (ascii(b, 0, 4) === 'OggS') return { kind: 'audio', mime: 'audio/ogg', ext: 'ogg' }
  return null
}

export function describeRejection(file: File, expected: SniffedKind): string {
  if (/heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
    return `${file.name} is a HEIC photo. Export it as JPEG (on iPhone: Settings › Camera › Formats › Most Compatible) and try again.`
  }
  const what = { image: 'a JPEG, PNG or WebP image', video: 'an MP4 or WebM video', audio: 'an MP3, M4A, OGG or WAV file' }[expected]
  return `${file.name} isn't ${what}.`
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<{ blob: Blob; ext: string; mime: string }> {
  const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', quality))
  if (webp && webp.type === 'image/webp') return { blob: webp, ext: 'webp', mime: 'image/webp' }
  // Safari < 17 cannot encode WebP; fall back to JPEG.
  const jpg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality))
  if (!jpg) throw new Error('Could not process this image')
  return { blob: jpg, ext: 'jpg', mime: 'image/jpeg' }
}

function drawScaled(source: CanvasImageSource, w: number, h: number, maxEdge: number): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

export interface OptimisedImage {
  display: Blob
  thumb: Blob
  ext: string
  mime: string
  width: number
  height: number
}

/** Resizes to ≤1600px (display) and ≤640px (thumb), re-encoded as WebP. Strips EXIF. */
export async function optimiseImage(file: Blob, opts: { displayEdge?: number; thumbEdge?: number } = {}): Promise<OptimisedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const display = drawScaled(bitmap, bitmap.width, bitmap.height, opts.displayEdge ?? LIMITS.displayEdge)
    const thumb = drawScaled(bitmap, bitmap.width, bitmap.height, opts.thumbEdge ?? LIMITS.thumbEdge)
    const d = await canvasToBlob(display, 0.82)
    const t = await canvasToBlob(thumb, 0.72)
    return { display: d.blob, thumb: t.blob, ext: d.ext, mime: d.mime, width: display.width, height: display.height }
  } finally {
    bitmap.close()
  }
}

export interface VideoInfo {
  poster: Blob | null
  posterExt: string
  durationS: number | null
  width: number
  height: number
}

/** Extracts duration and a poster frame (~1s in) without uploading anything. */
export function inspectVideo(file: Blob): Promise<VideoInfo> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.src = url
    const done = (info: VideoInfo) => {
      URL.revokeObjectURL(url)
      resolve(info)
    }
    const fallback = setTimeout(() => done({ poster: null, posterExt: 'webp', durationS: null, width: 0, height: 0 }), 15000)
    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 3)
    })
    video.addEventListener('seeked', async () => {
      clearTimeout(fallback)
      try {
        const canvas = drawScaled(video, video.videoWidth, video.videoHeight, 1280)
        const { blob, ext } = await canvasToBlob(canvas, 0.78)
        done({ poster: blob, posterExt: ext, durationS: Number.isFinite(video.duration) ? Math.round(video.duration) : null, width: video.videoWidth, height: video.videoHeight })
      } catch {
        done({ poster: null, posterExt: 'webp', durationS: Number.isFinite(video.duration) ? Math.round(video.duration) : null, width: video.videoWidth, height: video.videoHeight })
      }
    })
    video.addEventListener('error', () => {
      clearTimeout(fallback)
      done({ poster: null, posterExt: 'webp', durationS: null, width: 0, height: 0 })
    })
  })
}

export const randomName = () => crypto.randomUUID().replaceAll('-', '').slice(0, 20)
