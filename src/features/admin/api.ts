import { AppError, unwrap } from '@/lib/errors'
import { describeRejection, optimiseImage, randomName, sniffFile } from '@/lib/storage/media'
import { templateAssetUrl } from '@/lib/storage/storage'
import { supabase, TEMPLATE_BUCKET } from '@/lib/supabase/client'
import type { SectionDef, TemplateConfig } from '@/lib/validation/template'
import type { AdminDashboardStats, TemplateCategoryRow, TemplateMediaRow, TemplateRow, TemplateSectionRow, TemplateVersionRow } from '@/types/db'
import { TEMPLATE_PRESETS } from '../templates/presets/presets'

export const getDashboard = async () => unwrap(await supabase.rpc('admin_dashboard')) as AdminDashboardStats

// ---------------------------------------------------------------- templates
export type AdminTemplate = TemplateRow & {
  category: Pick<TemplateCategoryRow, 'id' | 'name'> | null
  versions: Pick<TemplateVersionRow, 'id' | 'version' | 'status'>[]
}

export async function listAllTemplates(): Promise<AdminTemplate[]> {
  return unwrap(
    await supabase.from('invitation_templates').select('*, category:template_categories(id, name), versions:template_versions(id, version, status)').order('position').order('name'),
  ) as unknown as AdminTemplate[]
}

export async function getTemplate(id: string): Promise<AdminTemplate> {
  const row = unwrap(
    await supabase.from('invitation_templates').select('*, category:template_categories(id, name), versions:template_versions(id, version, status)').eq('id', id).maybeSingle(),
  ) as unknown as AdminTemplate | null
  if (!row) throw new AppError('Template not found.')
  return row
}

export type TemplatePatch = Partial<
  Pick<
    TemplateRow,
    | 'name' | 'slug' | 'tagline' | 'description' | 'category_id' | 'cultural_tags' | 'languages' | 'cover_image_url' | 'preview_images'
    | 'supports_music' | 'supports_video' | 'supports_gallery' | 'status' | 'is_featured' | 'position' | 'sample_data'
  >
>

export async function updateTemplate(id: string, patch: TemplatePatch): Promise<void> {
  unwrap(await supabase.from('invitation_templates').update(patch).eq('id', id))
}

/** Starting points for new templates: any launch preset, or a blank editorial base. */
export function presetFor(slug: string | null) {
  const preset = TEMPLATE_PRESETS.find((p) => p.slug === slug) ?? TEMPLATE_PRESETS.find((p) => p.slug === 'atelier-modern')!
  return preset
}

export async function createTemplate(name: string, slug: string, fromPreset: string | null): Promise<string> {
  const preset = presetFor(fromPreset)
  const id = unwrap(
    await supabase.rpc('admin_create_template', { p_name: name, p_slug: slug, p_config: preset.config, p_sections: preset.sections }),
  ) as string
  await updateTemplate(id, {
    tagline: preset.tagline,
    description: preset.description,
    cultural_tags: preset.culturalTags,
    languages: preset.languages,
    cover_image_url: preset.coverImage,
    preview_images: preset.previewImages,
    sample_data: preset.sample as unknown as Record<string, unknown>,
  })
  return id
}

export async function duplicateTemplate(id: string, name: string, slug: string): Promise<string> {
  return unwrap(await supabase.rpc('admin_duplicate_template', { p_template: id, p_name: name, p_slug: slug })) as string
}

export async function deleteTemplate(id: string): Promise<void> {
  const { count } = await supabase.from('weddings').select('id', { count: 'exact', head: true }).eq('template_id', id)
  if (count) throw new AppError(`${count} wedding(s) use this template. Archive it instead.`)
  unwrap(await supabase.from('invitation_templates').delete().eq('id', id))
}

// ---------------------------------------------------------------- versions & sections
export async function listVersions(templateId: string): Promise<(TemplateVersionRow & { weddings: number })[]> {
  const versions = unwrap(await supabase.from('template_versions').select('*').eq('template_id', templateId).order('version', { ascending: false })) as TemplateVersionRow[]
  const usage = await Promise.all(
    versions.map(async (v) => (await supabase.from('weddings').select('id', { count: 'exact', head: true }).eq('template_version_id', v.id)).count ?? 0),
  )
  return versions.map((v, i) => ({ ...v, weddings: usage[i] }))
}

export async function ensureDraft(templateId: string): Promise<string> {
  return unwrap(await supabase.rpc('admin_ensure_draft_version', { p_template: templateId })) as string
}

export async function getVersion(versionId: string): Promise<{ version: TemplateVersionRow; sections: TemplateSectionRow[] }> {
  const version = unwrap(await supabase.from('template_versions').select('*').eq('id', versionId).single()) as TemplateVersionRow
  const sections = unwrap(await supabase.from('template_sections').select('*').eq('version_id', versionId).order('position')) as TemplateSectionRow[]
  return { version, sections }
}

export interface EditableSection extends SectionDef {
  id?: string
}

/** Persists a draft version: config + full section list (insert / update / delete by diff). */
export async function saveDraft(versionId: string, config: TemplateConfig, sections: EditableSection[], previous: TemplateSectionRow[]): Promise<void> {
  unwrap(await supabase.from('template_versions').update({ config }).eq('id', versionId))
  const keep = new Set(sections.filter((s) => s.id).map((s) => s.id))
  const removed = previous.filter((p) => !keep.has(p.id))
  if (removed.length) unwrap(await supabase.from('template_sections').delete().in('id', removed.map((r) => r.id)))
  // Two-phase key update avoids transient unique (version_id, section_key) collisions on renames/reorders.
  await Promise.all(
    sections
      .filter((s) => s.id)
      .map(async (s, i) => unwrap(await supabase.from('template_sections').update({ section_key: `tmp-${i}-${randomName().slice(0, 6)}` }).eq('id', s.id!))),
  )
  await Promise.all(
    sections.map(async (s, position) => {
      const row = { section_key: s.key, type: s.type, enabled: s.enabled, position, config: s.config }
      if (s.id) unwrap(await supabase.from('template_sections').update(row).eq('id', s.id))
      else unwrap(await supabase.from('template_sections').insert({ ...row, version_id: versionId }))
    }),
  )
}

export async function publishVersion(versionId: string, changelog: string): Promise<void> {
  unwrap(await supabase.rpc('admin_publish_version', { p_version: versionId, p_changelog: changelog }))
}

export async function discardDraft(versionId: string): Promise<void> {
  unwrap(await supabase.from('template_versions').delete().eq('id', versionId).eq('status', 'draft'))
}

// ---------------------------------------------------------------- categories
export async function listCategoriesAdmin(): Promise<(TemplateCategoryRow & { templates: { count: number }[] })[]> {
  return unwrap(await supabase.from('template_categories').select('*, templates:invitation_templates(count)').order('position')) as unknown as (TemplateCategoryRow & { templates: { count: number }[] })[]
}

export async function saveCategory(c: Partial<TemplateCategoryRow> & { name: string; slug: string }): Promise<void> {
  const row = { name: c.name, slug: c.slug, description: c.description ?? null, position: c.position ?? 0 }
  if (c.id) unwrap(await supabase.from('template_categories').update(row).eq('id', c.id))
  else unwrap(await supabase.from('template_categories').insert(row))
}

export async function deleteCategory(id: string): Promise<void> {
  unwrap(await supabase.from('template_categories').delete().eq('id', id))
}

// ---------------------------------------------------------------- media library
export async function listLibrary(): Promise<(TemplateMediaRow & { url: string })[]> {
  const rows = unwrap(await supabase.from('template_media').select('*').is('template_id', null).eq('kind', 'audio').order('created_at')) as TemplateMediaRow[]
  return rows.map((r) => ({ ...r, url: r.public_url ?? (r.storage_path ? templateAssetUrl(r.storage_path) : '') }))
}

export async function uploadLibraryTrack(file: File, title: string, description: string): Promise<void> {
  const sniffed = await sniffFile(file)
  if (!sniffed || sniffed.kind !== 'audio' || !['audio/mpeg', 'audio/mp4', 'audio/ogg'].includes(sniffed.mime)) throw new AppError('Upload an MP3, M4A or OGG file.')
  if (file.size > 20 * 1024 * 1024) throw new AppError('Tracks can be up to 20 MB.')
  const path = `library/audio/${randomName()}.${sniffed.ext}`
  unwrap(await supabase.storage.from(TEMPLATE_BUCKET).upload(path, file, { contentType: sniffed.mime, cacheControl: '31536000' }))
  unwrap(await supabase.from('template_media').insert({ kind: 'audio', title: title.trim() || file.name, description: description.trim() || null, storage_path: path, mime_type: sniffed.mime, size_bytes: file.size }))
}

export async function updateLibraryItem(id: string, patch: Partial<Pick<TemplateMediaRow, 'title' | 'description' | 'is_active'>>): Promise<void> {
  unwrap(await supabase.from('template_media').update(patch).eq('id', id))
}

export async function deleteLibraryItem(item: TemplateMediaRow): Promise<void> {
  unwrap(await supabase.from('template_media').delete().eq('id', item.id))
  if (item.storage_path) await supabase.storage.from(TEMPLATE_BUCKET).remove([item.storage_path])
}

/** Uploads an optimised image to the public template-assets bucket and returns its URL. */
export async function uploadTemplateImage(templateId: string, folder: 'previews' | 'backgrounds' | 'decorations', file: File): Promise<string> {
  const sniffed = await sniffFile(file)
  if (!sniffed || sniffed.kind !== 'image') throw new AppError(describeRejection(file, 'image'))
  const img = await optimiseImage(file, { displayEdge: 1800, thumbEdge: 640 })
  const name = randomName()
  const path = `${templateId}/${folder}/${name}.${img.ext}`
  unwrap(await supabase.storage.from(TEMPLATE_BUCKET).upload(path, img.display, { contentType: img.mime, cacheControl: '31536000' }))
  unwrap(await supabase.storage.from(TEMPLATE_BUCKET).upload(`${templateId}/${folder}/${name}-sm.${img.ext}`, img.thumb, { contentType: img.mime, cacheControl: '31536000' }))
  return templateAssetUrl(path)
}
