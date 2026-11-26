import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Chips, Field, Input, Select, Switch, Textarea } from '@/components/ui/Field'
import { Panel } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { LANGUAGES } from '@/lib/languages'
import { deleteTemplate, listCategoriesAdmin, updateTemplate, uploadTemplateImage, type AdminTemplate } from '../api'

export default function DetailsTab({ t }: { t: AdminTemplate }) {
  const qc = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const cats = useQuery({ queryKey: ['admin-categories'], queryFn: listCategoriesAdmin })
  const [v, setV] = useState({ ...t, tags: t.cultural_tags.join(', ') })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const coverInput = useRef<HTMLInputElement>(null)
  const previewInput = useRef<HTMLInputElement>(null)
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((x) => ({ ...x, [k]: val }))

  const save = useMutation({
    mutationFn: () =>
      updateTemplate(t.id, {
        name: v.name.trim(),
        slug: v.slug.trim(),
        tagline: v.tagline?.trim() || null,
        description: v.description?.trim() || null,
        category_id: v.category_id || null,
        cultural_tags: v.tags.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).slice(0, 20),
        languages: v.languages.length ? v.languages : ['en'],
        cover_image_url: v.cover_image_url,
        preview_images: v.preview_images,
        supports_music: v.supports_music,
        supports_video: v.supports_video,
        supports_gallery: v.supports_gallery,
        status: v.status,
        is_featured: v.is_featured,
        position: v.position,
      }),
    onSuccess: () => (qc.invalidateQueries({ queryKey: ['admin-template', t.id] }), qc.invalidateQueries({ queryKey: ['admin-templates'] }), toast.success('Template saved')),
    onError: (e) => toast.error(e.message),
  })
  const upload = useMutation({
    mutationFn: async ({ file, kind }: { file: File; kind: 'cover' | 'preview' }) => ({ url: await uploadTemplateImage(t.id, 'previews', file), kind }),
    onSuccess: ({ url, kind }) => (kind === 'cover' ? set('cover_image_url', url) : set('preview_images', [...v.preview_images, url]), toast.info('Uploaded — save to apply')),
    onError: (e) => toast.error(e.message),
  })
  const remove = useMutation({ mutationFn: () => deleteTemplate(t.id), onSuccess: () => (qc.invalidateQueries({ queryKey: ['admin-templates'] }), navigate('/admin/templates')), onError: (e) => (toast.error(e.message), setConfirmDelete(false)) })

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Panel title="Catalogue listing">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name">{(id) => <Input id={id} value={v.name} maxLength={80} onChange={(e) => set('name', e.target.value)} />}</Field>
            <Field label="Slug" hint="Changing it breaks existing demo links.">{(id, d) => <Input id={id} aria-describedby={d} value={v.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} />}</Field>
            <Field label="Tagline" className="sm:col-span-2">{(id) => <Input id={id} value={v.tagline ?? ''} maxLength={160} onChange={(e) => set('tagline', e.target.value)} />}</Field>
            <Field label="Description" className="sm:col-span-2">{(id) => <Textarea id={id} rows={3} maxLength={1000} value={v.description ?? ''} onChange={(e) => set('description', e.target.value)} />}</Field>
            <Field label="Design category">
              {(id) => (
                <Select id={id} value={v.category_id ?? ''} onChange={(e) => set('category_id', e.target.value || null)}>
                  <option value="">None</option>
                  {cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Catalogue order">{(id) => <Input id={id} type="number" value={v.position} onChange={(e) => set('position', Number(e.target.value))} />}</Field>
            <Field label="Cultural compatibility tags" className="sm:col-span-2" hint="Comma-separated, e.g. hindu, telugu, south-indian. Used for catalogue filters.">
              {(id, d) => <Input id={id} aria-describedby={d} value={v.tags} onChange={(e) => set('tags', e.target.value)} />}
            </Field>
          </div>
        </Panel>
        <Panel title="Regional language support">
          <Chips label="Languages" options={LANGUAGES.map((l) => ({ value: l.code, label: l.name }))} value={v.languages} onChange={(x) => set('languages', x)} />
        </Panel>
        <Panel title="Capabilities">
          <div className="grid gap-4 sm:grid-cols-3">
            <Switch checked={v.supports_music} onChange={(x) => set('supports_music', x)} label="Music" />
            <Switch checked={v.supports_video} onChange={(x) => set('supports_video', x)} label="Video" />
            <Switch checked={v.supports_gallery} onChange={(x) => set('supports_gallery', x)} label="Photo gallery" />
          </div>
        </Panel>
      </div>
      <div className="space-y-6">
        <Panel title="Visibility">
          <Field label="Status" hint={t.current_version_id ? 'Live templates are visible to customers.' : 'Publish a version in the Builder before going live.'}>
            {(id, d) => (
              <Select id={id} aria-describedby={d} value={v.status} onChange={(e) => set('status', e.target.value as AdminTemplate['status'])}>
                <option value="draft">Draft</option>
                <option value="published" disabled={!t.current_version_id}>Live</option>
                <option value="archived">Archived</option>
              </Select>
            )}
          </Field>
          <div className="mt-5">
            <Switch checked={v.is_featured} onChange={(x) => set('is_featured', x)} label="Featured on the home page" />
          </div>
        </Panel>
        <Panel title="Cover image">
          <div className="aspect-[3/4] overflow-hidden rounded-xl bg-blush">{v.cover_image_url && <img src={v.cover_image_url} alt="" className="size-full object-cover" />}</div>
          <Button className="mt-3" size="sm" variant="secondary" loading={upload.isPending && upload.variables?.kind === 'cover'} icon={<ImagePlus className="size-4" aria-hidden />} onClick={() => coverInput.current?.click()}>
            Replace cover
          </Button>
          <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => e.target.files?.[0] && upload.mutate({ file: e.target.files[0], kind: 'cover' })} />
        </Panel>
        <Panel title="Preview images">
          <div className="grid grid-cols-3 gap-2">
            {v.preview_images.map((src) => (
              <div key={src} className="group relative aspect-square overflow-hidden rounded-lg bg-blush">
                <img src={src} alt="" className="size-full object-cover" />
                <button type="button" onClick={() => set('preview_images', v.preview_images.filter((x) => x !== src))} className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-white/90 text-danger" aria-label="Remove image">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button className="mt-3" size="sm" variant="secondary" loading={upload.isPending && upload.variables?.kind === 'preview'} icon={<ImagePlus className="size-4" aria-hidden />} onClick={() => previewInput.current?.click()}>
            Add image
          </Button>
          <input ref={previewInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => e.target.files?.[0] && upload.mutate({ file: e.target.files[0], kind: 'preview' })} />
        </Panel>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => save.mutate()} loading={save.isPending}>Save details</Button>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
        </div>
      </div>
      <ConfirmDialog open={confirmDelete} title={`Delete ${t.name}?`} body="Only possible when no wedding uses it. Archive instead to hide it from the catalogue while keeping existing invitations working." confirmLabel="Delete template" danger loading={remove.isPending} onConfirm={() => remove.mutate()} onClose={() => setConfirmDelete(false)} />
    </div>
  )
}
