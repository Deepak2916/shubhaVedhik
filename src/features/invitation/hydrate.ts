import { AppError } from '@/lib/errors'
import { templateAssetUrl } from '@/lib/storage/publicUrls'
import { invitationDataSchema, type InvitationData } from '@/lib/validation/invitation'
import type { MessageKind } from '@/lib/validation/template'
import { sectionDefSchema, templateConfigSchema, type SectionDef } from '@/lib/validation/template'
import type { TemplateModel } from './engine/context'

export type SignFn = (paths: (string | null | undefined)[]) => Promise<Record<string, string>>

/** Shape returned by build_wedding_payload() — storage paths, not URLs. */
export interface WeddingPayload {
  id: string
  slug: string
  status: string
  groomName: string
  brideName: string
  groomParents: string | null
  brideParents: string | null
  date: string | null
  time: string | null
  city: string | null
  venueName: string | null
  venueAddress: string | null
  mapsUrl: string | null
  coupleIntro: string | null
  invitationMessage: string | null
  religion: string | null
  primaryLanguage: string
  languages: string[]
  traditions: string[]
  localized: Record<string, Record<string, string>>
  themeOverrides: Record<string, string>
  musicSettings: { volume?: number; autoplay?: boolean; startOn?: 'open' | 'manual' }
  coverPhotoId: string | null
  photos: { id: string; kind: string; path: string; thumbPath: string | null; width: number | null; height: number | null; caption: string | null }[]
  videos: { id: string; path: string; posterPath: string | null; mimeType: string; title: string | null; description: string | null; durationS: number | null }[]
  audio: { title: string | null; path: string | null; libraryPath: string | null; libraryUrl: string | null } | null
  events: (Record<string, string | null> & { id: string; name: string; kind: string; imagePath: string | null })[]
  messages: { id: string; kind: MessageKind; language: string; title: string | null; body: string; meta: { date?: string; photoId?: string } }[]
  template: { id: string; slug: string; name: string; versionId: string; version: number; config: unknown; sections: unknown[] } | null
}

export interface LoadedInvitation {
  template: TemplateModel
  data: InvitationData
  weddingId?: string
  status?: string
}

export function parseTemplate(raw: { slug: string; name: string; config: unknown; sections: unknown[] }): TemplateModel {
  const config = templateConfigSchema.parse(raw.config)
  const sections: SectionDef[] = raw.sections.map((s) => sectionDefSchema.parse(s))
  return { slug: raw.slug, name: raw.name, config, sections }
}

/** Converts a wedding payload into renderer input, signing every media path in one request. */
export async function hydrate(p: WeddingPayload, signPaths: SignFn): Promise<LoadedInvitation> {
  if (!p.template) throw new AppError('This invitation has no design selected yet.')
  const urls = await signPaths([
    ...p.photos.flatMap((x) => [x.path, x.thumbPath]),
    ...p.videos.flatMap((x) => [x.path, x.posterPath]),
    p.audio?.path,
    ...p.events.map((e) => e.imagePath),
  ])
  const photos = p.photos
    .filter((x) => urls[x.path])
    .map((x) => ({ id: x.id, kind: x.kind, url: urls[x.path], thumbUrl: (x.thumbPath && urls[x.thumbPath]) || urls[x.path], width: x.width, height: x.height, caption: x.caption }))
  const photoUrlById = Object.fromEntries(photos.map((x) => [x.id, x.url]))
  const cover = photos.find((x) => x.id === p.coverPhotoId)
  const audioUrl = p.audio ? (p.audio.path ? urls[p.audio.path] : (p.audio.libraryUrl ?? (p.audio.libraryPath ? templateAssetUrl(p.audio.libraryPath) : null))) : null

  const data = invitationDataSchema.parse({
    slug: p.slug,
    groomName: p.groomName,
    brideName: p.brideName,
    groomParents: p.groomParents,
    brideParents: p.brideParents,
    date: p.date,
    time: p.time,
    city: p.city,
    venueName: p.venueName,
    venueAddress: p.venueAddress,
    mapsUrl: p.mapsUrl,
    coupleIntro: p.coupleIntro,
    invitationMessage: p.invitationMessage,
    religion: p.religion,
    primaryLanguage: p.primaryLanguage,
    languages: p.languages?.length ? p.languages : ['en'],
    traditions: p.traditions ?? [],
    localized: p.localized ?? {},
    themeOverrides: p.themeOverrides ?? {},
    musicSettings: { volume: 0.6, autoplay: true, startOn: 'open', ...p.musicSettings },
    coverUrl: cover?.url ?? null,
    photos,
    videos: p.videos
      .filter((v) => urls[v.path])
      .map((v) => ({ id: v.id, url: urls[v.path], posterUrl: v.posterPath ? urls[v.posterPath] : null, mimeType: v.mimeType, title: v.title, description: v.description, durationS: v.durationS === null ? null : Number(v.durationS) })),
    audio: audioUrl ? { url: audioUrl, title: p.audio?.title } : null,
    events: p.events.map((e) => ({ ...e, imageUrl: e.imagePath ? (urls[e.imagePath] ?? null) : null })),
    messages: p.messages.map((m) => ({ ...m, meta: { ...m.meta, photoUrl: m.meta?.photoId ? photoUrlById[m.meta.photoId] : undefined } })),
  })
  return { template: parseTemplate(p.template), data, weddingId: p.id, status: p.status }
}


export interface TemplatePayload {
  id: string
  slug: string
  name: string
  versionId: string
  version: number
  versionStatus: string
  config: unknown
  sampleData: unknown
  sections: unknown[]
}

export function templatePayloadToInvitation(p: TemplatePayload): LoadedInvitation {
  return { template: parseTemplate(p), data: invitationDataSchema.parse(p.sampleData) }
}
