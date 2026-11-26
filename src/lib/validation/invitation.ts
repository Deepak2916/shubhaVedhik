import { z } from 'zod'
import { MESSAGE_KINDS, paletteSchema } from './template.ts'

/**
 * The data the invitation renderer consumes. Produced from:
 *  - a live wedding (get_public_wedding / get_wedding_preview + signed URLs), or
 *  - a template's sample_data (previews, demos).
 */

export const PHOTO_KINDS = ['bride', 'groom', 'couple', 'engagement', 'prewedding', 'family', 'other'] as const
export type PhotoKind = (typeof PHOTO_KINDS)[number]

const url = z.string().max(2000)

export const invitationPhotoSchema = z.object({
  id: z.string(),
  kind: z.enum(PHOTO_KINDS),
  url,
  thumbUrl: url,
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  caption: z.string().nullable().optional(),
})

export const invitationVideoSchema = z.object({
  id: z.string(),
  url,
  posterUrl: url.nullable().optional(),
  mimeType: z.string().optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  durationS: z.number().nullable().optional(),
})

export const invitationEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.string(),
  description: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  venueName: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  mapsUrl: z.string().nullable().optional(),
  dressCode: z.string().nullable().optional(),
  imageUrl: url.nullable().optional(),
  icon: z.string().nullable().optional(),
})

export const invitationMessageSchema = z.object({
  id: z.string(),
  kind: z.enum(MESSAGE_KINDS),
  language: z.string(),
  title: z.string().nullable().optional(),
  body: z.string(),
  meta: z
    .object({ date: z.string().optional(), photoId: z.string().optional(), photoUrl: z.string().optional() })
    .partial()
    .optional(),
})

export const localizedNamesSchema = z
  .object({
    groomName: z.string().max(80),
    brideName: z.string().max(80),
    headline: z.string().max(160),
    groomParents: z.string().max(200),
    brideParents: z.string().max(200),
    invitationMessage: z.string().max(2000),
  })
  .partial()

export const musicSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  volume: z.number().min(0).max(1).default(0.6),
  autoplay: z.boolean().default(true),
  startOn: z.enum(['open', 'manual']).default('open'),
})

export const invitationDataSchema = z.object({
  slug: z.string(),
  groomName: z.string(),
  brideName: z.string(),
  groomParents: z.string().nullable().optional(),
  brideParents: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  venueName: z.string().nullable().optional(),
  venueAddress: z.string().nullable().optional(),
  mapsUrl: z.string().nullable().optional(),
  coupleIntro: z.string().nullable().optional(),
  invitationMessage: z.string().nullable().optional(),
  religion: z.string().nullable().optional(),
  primaryLanguage: z.string().default('en'),
  languages: z.array(z.string()).default(['en']),
  traditions: z.array(z.string()).default([]),
  localized: z.record(z.string(), localizedNamesSchema).default({}),
  themeOverrides: paletteSchema.partial().default({}),
  musicSettings: musicSettingsSchema.default({ enabled: true, volume: 0.6, autoplay: true, startOn: 'open' }),
  coverUrl: url.nullable().optional(),
  photos: z.array(invitationPhotoSchema).default([]),
  videos: z.array(invitationVideoSchema).default([]),
  audio: z.object({ url, title: z.string().nullable().optional() }).nullable().optional(),
  events: z.array(invitationEventSchema).default([]),
  messages: z.array(invitationMessageSchema).default([]),
})

export type InvitationData = z.infer<typeof invitationDataSchema>
export type InvitationDataInput = z.input<typeof invitationDataSchema>
export type InvitationPhoto = z.infer<typeof invitationPhotoSchema>
export type InvitationVideo = z.infer<typeof invitationVideoSchema>
export type InvitationEvent = z.infer<typeof invitationEventSchema>
export type InvitationMessage = z.infer<typeof invitationMessageSchema>
export type LocalizedNames = z.infer<typeof localizedNamesSchema>
export type MusicSettings = z.infer<typeof musicSettingsSchema>
