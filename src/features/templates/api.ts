import { useQuery } from '@tanstack/react-query'
import { env } from '@/lib/env'
import { unwrap } from '@/lib/errors'
import { supabase } from '@/lib/supabase/client'
import type { TemplateCategoryRow, TemplateRow } from '@/types/db'
import { TEMPLATE_CATEGORIES, TEMPLATE_PRESETS } from './presets/presets'

export type CatalogTemplate = Pick<
  TemplateRow,
  'id' | 'slug' | 'name' | 'tagline' | 'description' | 'cultural_tags' | 'languages' | 'cover_image_url' | 'preview_images' | 'supports_music' | 'supports_video' | 'supports_gallery' | 'is_featured' | 'current_version_id'
> & { category: Pick<TemplateCategoryRow, 'slug' | 'name'> | null }

const COLUMNS =
  'id, slug, name, tagline, description, cultural_tags, languages, cover_image_url, preview_images, supports_music, supports_video, supports_gallery, is_featured, current_version_id, position, category:template_categories(slug, name)'

/** Offline catalogue from bundled presets (when Supabase env vars are absent). */
function presetCatalog(): CatalogTemplate[] {
  return TEMPLATE_PRESETS.map((p) => ({
    id: p.slug,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    cultural_tags: p.culturalTags,
    languages: p.languages,
    cover_image_url: p.coverImage,
    preview_images: p.previewImages,
    supports_music: true,
    supports_video: p.sections.some((s) => s.type === 'videos'),
    supports_gallery: true,
    is_featured: p.featured,
    current_version_id: null,
    category: TEMPLATE_CATEGORIES.find((c) => c.slug === p.category) ?? null,
  }))
}

export async function listPublishedTemplates(): Promise<CatalogTemplate[]> {
  if (!env.isConfigured) return presetCatalog()
  const rows = unwrap(
    await supabase.from('invitation_templates').select(COLUMNS).eq('status', 'published').not('current_version_id', 'is', null).order('position').order('name'),
  ) as unknown as CatalogTemplate[]
  return rows
}

export async function getTemplateBySlug(slug: string): Promise<CatalogTemplate | null> {
  if (!env.isConfigured) return presetCatalog().find((t) => t.slug === slug) ?? null
  const row = unwrap(await supabase.from('invitation_templates').select(COLUMNS).eq('slug', slug).maybeSingle()) as unknown as CatalogTemplate | null
  return row
}

export async function listCategories(): Promise<Pick<TemplateCategoryRow, 'id' | 'slug' | 'name' | 'description'>[]> {
  if (!env.isConfigured) return TEMPLATE_CATEGORIES.map((c) => ({ ...c, id: c.slug }))
  return unwrap(await supabase.from('template_categories').select('id, slug, name, description').order('position'))
}

export function usePublishedTemplates() {
  return useQuery({ queryKey: ['templates', 'published'], queryFn: listPublishedTemplates, staleTime: 5 * 60_000 })
}

export function useCategories() {
  return useQuery({ queryKey: ['template-categories'], queryFn: listCategories, staleTime: 10 * 60_000 })
}

export const CULTURE_FILTERS = [
  { value: 'hindu', label: 'Hindu' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'christian', label: 'Christian' },
  { value: 'sikh', label: 'Sikh' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'punjabi', label: 'Punjabi' },
  { value: 'interfaith', label: 'Interfaith' },
]
