/**
 * Row types for the tables the app reads directly. Hand-written to match
 * supabase/migrations. When a Supabase project is linked you can replace this
 * with `supabase gen types typescript` output.
 */
import type { LocalizedNames, MusicSettings, PhotoKind } from '@/lib/validation/invitation'
import type { MessageKind, Palette, SectionConfig, SectionType, TemplateConfig } from '@/lib/validation/template'

export type WeddingStatus = 'draft' | 'published' | 'unpublished'
export type TemplateStatus = 'draft' | 'published' | 'archived'
export type VersionStatus = 'draft' | 'published' | 'retired'

export interface ProfileRow {
  id: string
  full_name: string | null
  phone: string | null
  created_at: string
}

export interface WeddingRow {
  id: string
  owner_id: string
  slug: string
  status: WeddingStatus
  template_id: string | null
  template_version_id: string | null
  groom_name: string
  bride_name: string
  groom_parents: string | null
  bride_parents: string | null
  wedding_date: string | null
  wedding_time: string | null
  city: string | null
  venue_name: string | null
  venue_address: string | null
  maps_url: string | null
  couple_intro: string | null
  invitation_message: string | null
  religion: string | null
  primary_language: string
  languages: string[]
  traditions: string[]
  localized: Record<string, LocalizedNames>
  theme_overrides: Partial<Palette>
  music_settings: Partial<MusicSettings>
  cover_photo_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface WeddingPhotoRow {
  id: string
  wedding_id: string
  kind: PhotoKind
  storage_path: string
  thumb_path: string | null
  width: number | null
  height: number | null
  caption: string | null
  position: number
  created_at: string
}

export interface WeddingVideoRow {
  id: string
  wedding_id: string
  storage_path: string
  thumbnail_path: string | null
  mime_type: 'video/mp4' | 'video/webm'
  size_bytes: number
  duration_s: number | null
  title: string | null
  description: string | null
  position: number
}

export interface WeddingAudioRow {
  id: string
  wedding_id: string
  storage_path: string | null
  library_media_id: string | null
  title: string | null
  mime_type: string | null
  size_bytes: number | null
  is_active: boolean
  position: number
  created_at: string
}

export interface WeddingEventRow {
  id: string
  wedding_id: string
  name: string
  kind: string
  description: string | null
  event_date: string | null
  start_time: string | null
  end_time: string | null
  venue_name: string | null
  address: string | null
  maps_url: string | null
  dress_code: string | null
  image_path: string | null
  icon: string | null
  position: number
}

export interface WeddingMessageRow {
  id: string
  wedding_id: string
  kind: MessageKind
  language: string
  title: string | null
  body: string
  meta: { date?: string; photoId?: string }
  position: number
}

export interface TemplateCategoryRow {
  id: string
  slug: string
  name: string
  description: string | null
  position: number
}

export interface TemplateRow {
  id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  category_id: string | null
  cultural_tags: string[]
  languages: string[]
  cover_image_url: string | null
  preview_images: string[]
  supports_music: boolean
  supports_video: boolean
  supports_gallery: boolean
  status: TemplateStatus
  is_featured: boolean
  position: number
  sample_data: Record<string, unknown>
  current_version_id: string | null
  created_at: string
  updated_at: string
}

export interface TemplateVersionRow {
  id: string
  template_id: string
  version: number
  status: VersionStatus
  config: TemplateConfig
  changelog: string | null
  published_at: string | null
  created_at: string
}

export interface TemplateSectionRow {
  id: string
  version_id: string
  section_key: string
  type: SectionType
  position: number
  enabled: boolean
  config: SectionConfig
}

export interface TemplateMediaRow {
  id: string
  template_id: string | null
  kind: 'preview' | 'background' | 'decoration' | 'audio'
  title: string | null
  description: string | null
  storage_path: string | null
  public_url: string | null
  mime_type: string
  size_bytes: number | null
  is_active: boolean
  created_at: string
}

export interface WeddingAnalytics {
  totalVisits: number
  uniqueVisitors: number
  bySource: Partial<Record<'qr' | 'link' | 'preview' | 'other', number>>
  byDevice: Partial<Record<'mobile' | 'tablet' | 'desktop' | 'other', number>>
  interactions: Partial<Record<string, number>>
  daily: { day: string; visits: number; unique: number }[]
}

export interface AdminDashboardStats {
  customers: number
  weddings: number
  published: number
  drafts: number
  templates: number
  activeTemplates: number
  visits30d: number
  popular: { id: string; name: string; slug: string; coverImageUrl: string | null; uses: number }[]
  recent: { kind: 'wedding_created' | 'wedding_published' | 'version_published'; label: string; at: string }[]
}
