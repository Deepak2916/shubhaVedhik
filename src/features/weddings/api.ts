import { AppError, unwrap } from '@/lib/errors'
import { describeRejection, inspectVideo, LIMITS, optimiseImage, randomName, sniffFile } from '@/lib/storage/media'
import { removeObjects, removeWeddingFolder, signPaths, templateAssetUrl, uploadWithProgress, weddingFolder } from '@/lib/storage/storage'
import { supabase, WEDDING_BUCKET } from '@/lib/supabase/client'
import type { PhotoKind } from '@/lib/validation/invitation'
import type { MessageKind } from '@/lib/validation/template'
import type {
  TemplateMediaRow,
  WeddingAnalytics,
  WeddingAudioRow,
  WeddingEventRow,
  WeddingMessageRow,
  WeddingPhotoRow,
  WeddingRow,
  WeddingVideoRow,
} from '@/types/db'

export type Progress = (fraction: number) => void

// ---------------------------------------------------------------- weddings
export interface WeddingListItem extends WeddingRow {
  template: { id: string; name: string; slug: string; cover_image_url: string | null; current_version_id: string | null } | null
  cover: { storage_path: string; thumb_path: string | null } | null
  coverUrl?: string
}

export async function listMyWeddings(): Promise<WeddingListItem[]> {
  const rows = unwrap(
    await supabase
      .from('weddings')
      .select('*, template:invitation_templates(id, name, slug, cover_image_url, current_version_id), cover:wedding_photos!fk_weddings_cover_photo(storage_path, thumb_path)')
      .order('created_at', { ascending: false }),
  ) as unknown as WeddingListItem[]
  const urls = await signPaths(rows.map((r) => r.cover?.thumb_path ?? r.cover?.storage_path)).catch(() => ({}) as Record<string, string>)
  return rows.map((r) => ({ ...r, coverUrl: r.cover ? urls[r.cover.thumb_path ?? r.cover.storage_path] : undefined }))
}

export async function getWedding(id: string): Promise<WeddingListItem> {
  const row = unwrap(
    await supabase
      .from('weddings')
      .select('*, template:invitation_templates(id, name, slug, cover_image_url, current_version_id), cover:wedding_photos!fk_weddings_cover_photo(storage_path, thumb_path)')
      .eq('id', id)
      .maybeSingle(),
  ) as unknown as WeddingListItem | null
  if (!row) throw new AppError('Wedding not found.')
  return row
}

export async function createWedding(groom: string, bride: string, templateId?: string | null): Promise<WeddingRow> {
  return unwrap(await supabase.rpc('create_wedding', { p_groom: groom, p_bride: bride, p_template: templateId ?? null }).single()) as WeddingRow
}

export type WeddingPatch = Partial<
  Pick<
    WeddingRow,
    | 'slug' | 'groom_name' | 'bride_name' | 'groom_parents' | 'bride_parents' | 'wedding_date' | 'wedding_time' | 'city'
    | 'venue_name' | 'venue_address' | 'maps_url' | 'couple_intro' | 'invitation_message' | 'religion' | 'primary_language'
    | 'languages' | 'traditions' | 'localized' | 'theme_overrides' | 'music_settings' | 'cover_photo_id'
  >
>

export async function updateWedding(id: string, patch: WeddingPatch): Promise<void> {
  unwrap(await supabase.from('weddings').update(patch).eq('id', id))
}

export async function deleteWedding(w: Pick<WeddingRow, 'id' | 'owner_id'>): Promise<void> {
  await removeWeddingFolder(w.owner_id, w.id)
  unwrap(await supabase.from('weddings').delete().eq('id', w.id))
}

export async function selectTemplate(weddingId: string, templateId: string): Promise<void> {
  unwrap(await supabase.rpc('select_wedding_template', { p_wedding: weddingId, p_template: templateId }))
}

export async function upgradeTemplate(weddingId: string): Promise<void> {
  unwrap(await supabase.rpc('upgrade_wedding_template', { p_wedding: weddingId }))
}

export async function publishIssues(weddingId: string): Promise<string[]> {
  return (unwrap(await supabase.rpc('wedding_publish_issues', { p_wedding: weddingId })) as string[] | null) ?? []
}

export async function publishWedding(weddingId: string): Promise<void> {
  unwrap(await supabase.rpc('publish_wedding', { p_wedding: weddingId }))
}

export async function unpublishWedding(weddingId: string): Promise<void> {
  unwrap(await supabase.rpc('unpublish_wedding', { p_wedding: weddingId }))
}

export async function isSlugAvailable(slug: string, weddingId: string): Promise<boolean> {
  return unwrap(await supabase.rpc('is_slug_available', { p_slug: slug, p_wedding: weddingId })) === true
}

export async function getAnalytics(weddingId: string, days = 30): Promise<WeddingAnalytics> {
  return unwrap(await supabase.rpc('get_wedding_analytics', { p_wedding: weddingId, p_days: days })) as WeddingAnalytics
}

// ---------------------------------------------------------------- photos
export interface PhotoItem extends WeddingPhotoRow {
  url: string
  thumbUrl: string
}

export async function listPhotos(weddingId: string): Promise<PhotoItem[]> {
  const rows = unwrap(await supabase.from('wedding_photos').select('*').eq('wedding_id', weddingId).order('position').order('created_at')) as WeddingPhotoRow[]
  const urls = await signPaths(rows.flatMap((r) => [r.storage_path, r.thumb_path]))
  return rows.map((r) => ({ ...r, url: urls[r.storage_path] ?? '', thumbUrl: (r.thumb_path && urls[r.thumb_path]) || urls[r.storage_path] || '' }))
}

async function nextPosition(table: string, weddingId: string): Promise<number> {
  const { data } = await supabase.from(table).select('position').eq('wedding_id', weddingId).order('position', { ascending: false }).limit(1)
  return ((data?.[0] as { position?: number } | undefined)?.position ?? -1) + 1
}

export async function uploadPhoto(w: Pick<WeddingRow, 'id' | 'owner_id'>, file: File, kind: PhotoKind, onProgress?: Progress): Promise<void> {
  if (file.size > LIMITS.imageInputBytes) throw new AppError(`${file.name} is larger than 25 MB.`)
  const sniffed = await sniffFile(file)
  if (!sniffed || sniffed.kind !== 'image') throw new AppError(describeRejection(file, 'image'))
  onProgress?.(0.05)
  const img = await optimiseImage(file)
  const base = `${weddingFolder(w.owner_id, w.id)}`
  const name = `${randomName()}.${img.ext}`
  const displayPath = `${base}/photos/${name}`
  const thumbPath = `${base}/thumbnails/${name}`
  await uploadWithProgress(WEDDING_BUCKET, displayPath, img.display, img.mime, (f) => onProgress?.(0.1 + f * 0.7))
  await uploadWithProgress(WEDDING_BUCKET, thumbPath, img.thumb, img.mime, (f) => onProgress?.(0.8 + f * 0.15))
  const position = await nextPosition('wedding_photos', w.id)
  const res = await supabase.from('wedding_photos').insert({ wedding_id: w.id, kind, storage_path: displayPath, thumb_path: thumbPath, width: img.width, height: img.height, position })
  if (res.error) {
    await removeObjects([displayPath, thumbPath]).catch(() => undefined)
    unwrap(res)
  }
  onProgress?.(1)
}

export async function updatePhoto(id: string, patch: Partial<Pick<WeddingPhotoRow, 'caption' | 'kind' | 'position'>>): Promise<void> {
  unwrap(await supabase.from('wedding_photos').update(patch).eq('id', id))
}

export async function reorder(table: 'wedding_photos' | 'wedding_videos' | 'wedding_events' | 'wedding_messages', ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, position) => supabase.from(table).update({ position }).eq('id', id).then(unwrap)))
}

export async function deletePhoto(p: WeddingPhotoRow): Promise<void> {
  unwrap(await supabase.from('wedding_photos').delete().eq('id', p.id))
  await removeObjects([p.storage_path, p.thumb_path])
}

// ---------------------------------------------------------------- videos
export interface VideoItem extends WeddingVideoRow {
  url: string
  posterUrl?: string
}

export async function listVideos(weddingId: string): Promise<VideoItem[]> {
  const rows = unwrap(await supabase.from('wedding_videos').select('*').eq('wedding_id', weddingId).order('position')) as WeddingVideoRow[]
  const urls = await signPaths(rows.flatMap((r) => [r.storage_path, r.thumbnail_path]))
  return rows.map((r) => ({ ...r, url: urls[r.storage_path] ?? '', posterUrl: r.thumbnail_path ? urls[r.thumbnail_path] : undefined }))
}

export async function uploadVideo(w: Pick<WeddingRow, 'id' | 'owner_id'>, file: File, meta: { title?: string; description?: string }, onProgress?: Progress): Promise<void> {
  const sniffed = await sniffFile(file)
  if (!sniffed || sniffed.kind !== 'video') throw new AppError(describeRejection(file, 'video'))
  if (file.size > LIMITS.videoBytes) throw new AppError(`${file.name} is ${(file.size / 1048576).toFixed(0)} MB. Videos can be up to 150 MB — export at 1080p (H.264) to make it smaller.`)
  const info = await inspectVideo(file)
  const base = weddingFolder(w.owner_id, w.id)
  const id = randomName()
  const videoPath = `${base}/videos/${id}.${sniffed.ext}`
  const posterPath = info.poster ? `${base}/thumbnails/${id}-poster.${info.posterExt}` : null
  if (info.poster && posterPath) await uploadWithProgress(WEDDING_BUCKET, posterPath, info.poster, info.posterExt === 'webp' ? 'image/webp' : 'image/jpeg')
  await uploadWithProgress(WEDDING_BUCKET, videoPath, file, sniffed.mime, (f) => onProgress?.(f * 0.97))
  const position = await nextPosition('wedding_videos', w.id)
  const res = await supabase.from('wedding_videos').insert({
    wedding_id: w.id,
    storage_path: videoPath,
    thumbnail_path: posterPath,
    mime_type: sniffed.mime,
    size_bytes: file.size,
    duration_s: info.durationS,
    title: meta.title?.trim() || null,
    description: meta.description?.trim() || null,
    position,
  })
  if (res.error) {
    await removeObjects([videoPath, posterPath]).catch(() => undefined)
    unwrap(res)
  }
  onProgress?.(1)
}

export async function updateVideo(id: string, patch: Partial<Pick<WeddingVideoRow, 'title' | 'description'>>): Promise<void> {
  unwrap(await supabase.from('wedding_videos').update(patch).eq('id', id))
}

export async function deleteVideo(v: WeddingVideoRow): Promise<void> {
  unwrap(await supabase.from('wedding_videos').delete().eq('id', v.id))
  await removeObjects([v.storage_path, v.thumbnail_path])
}

// ---------------------------------------------------------------- music
export interface AudioItem extends WeddingAudioRow {
  url?: string
  library?: Pick<TemplateMediaRow, 'id' | 'title' | 'public_url' | 'storage_path'> | null
}

export async function listAudio(weddingId: string): Promise<AudioItem[]> {
  const rows = unwrap(
    await supabase.from('wedding_audio').select('*, library:template_media(id, title, public_url, storage_path)').eq('wedding_id', weddingId).order('created_at'),
  ) as unknown as AudioItem[]
  const urls = await signPaths(rows.map((r) => r.storage_path))
  return rows.map((r) => ({
    ...r,
    url: r.storage_path ? urls[r.storage_path] : (r.library?.public_url ?? (r.library?.storage_path ? templateAssetUrl(r.library.storage_path) : undefined)),
  }))
}

export async function listLibraryTracks(): Promise<(TemplateMediaRow & { url: string })[]> {
  const rows = unwrap(await supabase.from('template_media').select('*').eq('kind', 'audio').is('template_id', null).eq('is_active', true).order('title')) as TemplateMediaRow[]
  return rows.map((r) => ({ ...r, url: r.public_url ?? (r.storage_path ? templateAssetUrl(r.storage_path) : '') }))
}

async function setActiveAudio(weddingId: string, audioId: string): Promise<void> {
  unwrap(await supabase.from('wedding_audio').update({ is_active: false }).eq('wedding_id', weddingId).eq('is_active', true))
  unwrap(await supabase.from('wedding_audio').update({ is_active: true }).eq('id', audioId))
}
export { setActiveAudio }

export async function chooseLibraryTrack(weddingId: string, mediaId: string, title: string | null): Promise<void> {
  const existing = unwrap(await supabase.from('wedding_audio').select('id').eq('wedding_id', weddingId).eq('library_media_id', mediaId).maybeSingle()) as { id: string } | null
  const id = existing?.id ?? (unwrap(await supabase.from('wedding_audio').insert({ wedding_id: weddingId, library_media_id: mediaId, title }).select('id').single()) as { id: string }).id
  await setActiveAudio(weddingId, id)
}

export async function uploadAudio(w: Pick<WeddingRow, 'id' | 'owner_id'>, file: File, onProgress?: Progress): Promise<void> {
  const sniffed = await sniffFile(file)
  if (!sniffed || sniffed.kind !== 'audio') throw new AppError(describeRejection(file, 'audio'))
  if (file.size > LIMITS.audioBytes) throw new AppError('Music files can be up to 20 MB.')
  const path = `${weddingFolder(w.owner_id, w.id)}/audio/${randomName()}.${sniffed.ext}`
  await uploadWithProgress(WEDDING_BUCKET, path, file, sniffed.mime, onProgress)
  const res = await supabase
    .from('wedding_audio')
    .insert({ wedding_id: w.id, storage_path: path, title: file.name.replace(/\.[^.]+$/, '').slice(0, 120), mime_type: sniffed.mime, size_bytes: file.size })
    .select('id')
    .single()
  if (res.error) {
    await removeObjects([path]).catch(() => undefined)
    unwrap(res)
  }
  await setActiveAudio(w.id, (res.data as { id: string }).id)
}

export async function clearActiveAudio(weddingId: string): Promise<void> {
  unwrap(await supabase.from('wedding_audio').update({ is_active: false }).eq('wedding_id', weddingId).eq('is_active', true))
}

export async function deleteAudio(a: WeddingAudioRow): Promise<void> {
  unwrap(await supabase.from('wedding_audio').delete().eq('id', a.id))
  await removeObjects([a.storage_path])
}

// ---------------------------------------------------------------- events
export async function listEvents(weddingId: string): Promise<(WeddingEventRow & { imageUrl?: string })[]> {
  const rows = unwrap(await supabase.from('wedding_events').select('*').eq('wedding_id', weddingId).order('position').order('event_date')) as WeddingEventRow[]
  const urls = await signPaths(rows.map((r) => r.image_path))
  return rows.map((r) => ({ ...r, imageUrl: r.image_path ? urls[r.image_path] : undefined }))
}

export type EventInput = Omit<WeddingEventRow, 'id' | 'wedding_id' | 'position' | 'image_path'> & { id?: string }

export async function saveEvent(weddingId: string, e: EventInput): Promise<void> {
  if (e.id) {
    const { id, ...patch } = e
    unwrap(await supabase.from('wedding_events').update(patch).eq('id', id))
  } else {
    const position = await nextPosition('wedding_events', weddingId)
    unwrap(await supabase.from('wedding_events').insert({ ...e, wedding_id: weddingId, position }))
  }
}

export async function uploadEventImage(w: Pick<WeddingRow, 'id' | 'owner_id'>, eventId: string, file: File, previous?: string | null): Promise<void> {
  const sniffed = await sniffFile(file)
  if (!sniffed || sniffed.kind !== 'image') throw new AppError(describeRejection(file, 'image'))
  const img = await optimiseImage(file, { displayEdge: 1200 })
  const path = `${weddingFolder(w.owner_id, w.id)}/events/${randomName()}.${img.ext}`
  await uploadWithProgress(WEDDING_BUCKET, path, img.display, img.mime)
  unwrap(await supabase.from('wedding_events').update({ image_path: path }).eq('id', eventId))
  if (previous) await removeObjects([previous]).catch(() => undefined)
}

export async function deleteEvent(e: WeddingEventRow): Promise<void> {
  unwrap(await supabase.from('wedding_events').delete().eq('id', e.id))
  await removeObjects([e.image_path]).catch(() => undefined)
}

// ---------------------------------------------------------------- messages
export async function listMessages(weddingId: string): Promise<WeddingMessageRow[]> {
  return unwrap(await supabase.from('wedding_messages').select('*').eq('wedding_id', weddingId).order('kind').order('position')) as WeddingMessageRow[]
}

export interface MessageInput {
  id?: string
  kind: MessageKind
  language: string
  title: string | null
  body: string
  meta: { date?: string; photoId?: string }
}

export async function saveMessage(weddingId: string, m: MessageInput): Promise<void> {
  if (m.id) {
    const { id, ...patch } = m
    unwrap(await supabase.from('wedding_messages').update(patch).eq('id', id))
  } else {
    const position = await nextPosition('wedding_messages', weddingId)
    unwrap(await supabase.from('wedding_messages').insert({ ...m, wedding_id: weddingId, position }))
  }
}

export async function deleteMessage(id: string): Promise<void> {
  unwrap(await supabase.from('wedding_messages').delete().eq('id', id))
}
