import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, Copy, Eye, Plus, Star, Upload } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select } from '@/components/ui/Field'
import { Badge, Skeleton } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { TEMPLATE_PRESETS } from '../templates/presets/presets'
import { createTemplate, duplicateTemplate, listAllTemplates, updateTemplate, type AdminTemplate } from './api'

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

export function StatusTag({ status }: { status: AdminTemplate['status'] }) {
  return <Badge tone={status === 'published' ? 'success' : status === 'archived' ? 'neutral' : 'warning'}>{status === 'published' ? 'Live' : status === 'archived' ? 'Archived' : 'Draft'}</Badge>
}

function NameDialog({ open, title, initial, withPreset, onClose, onSubmit, loading }: { open: boolean; title: string; initial: string; withPreset?: boolean; onClose: () => void; onSubmit: (name: string, slug: string, preset: string | null) => void; loading: boolean }) {
  const [name, setName] = useState(initial)
  const [slug, setSlug] = useState(slugify(initial))
  const [preset, setPreset] = useState<string>(TEMPLATE_PRESETS[3].slug)
  const valid = name.trim().length >= 2 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} loading={loading} onClick={() => onSubmit(name.trim(), slug, withPreset ? preset : null)}>Create</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Name">{(id) => <Input id={id} value={name} onChange={(e) => (setName(e.target.value), setSlug(slugify(e.target.value)))} maxLength={80} />}</Field>
        <Field label="Slug" hint="Used in preview URLs. Lowercase letters, numbers and hyphens.">{(id, d) => <Input id={id} aria-describedby={d} value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />}</Field>
        {withPreset && (
          <Field label="Start from" hint="Copies the preset’s theme, sections and sample wedding. Everything is editable.">
            {(id, d) => (
              <Select id={id} aria-describedby={d} value={preset} onChange={(e) => setPreset(e.target.value)}>
                {TEMPLATE_PRESETS.map((p) => <option key={p.slug} value={p.slug}>{p.name} — {p.tagline}</option>)}
              </Select>
            )}
          </Field>
        )}
      </div>
    </Dialog>
  )
}

export default function AdminTemplatesPage() {
  useDocumentMeta({ title: 'Templates · Admin', noindex: true })
  const qc = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const q = useQuery({ queryKey: ['admin-templates'], queryFn: listAllTemplates })
  const [creating, setCreating] = useState(false)
  const [duplicating, setDuplicating] = useState<AdminTemplate | null>(null)
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-templates'] })

  const create = useMutation({ mutationFn: (a: { name: string; slug: string; preset: string | null }) => createTemplate(a.name, a.slug, a.preset), onSuccess: (id) => (invalidate(), toast.success('Template created'), navigate(`/admin/templates/${id}`)), onError: (e) => toast.error(e.message) })
  const dup = useMutation({ mutationFn: (a: { id: string; name: string; slug: string }) => duplicateTemplate(a.id, a.name, a.slug), onSuccess: (id) => (invalidate(), setDuplicating(null), toast.success('Duplicated as a draft'), navigate(`/admin/templates/${id}`)), onError: (e) => toast.error(e.message) })
  const patch = useMutation({ mutationFn: (a: { id: string; patch: Parameters<typeof updateTemplate>[1] }) => updateTemplate(a.id, a.patch), onSuccess: invalidate, onError: (e) => toast.error(e.message) })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Templates</h1>
          <p className="mt-1 text-mist">Live templates with a published version appear in the customer catalogue.</p>
        </div>
        <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setCreating(true)}>New template</Button>
      </div>
      <div className="overflow-x-auto rounded-[22px] bg-white shadow-card ring-1 ring-rose/60">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-rose/70 text-mist">
            <tr>
              <th className="px-5 py-3 font-normal">Template</th>
              <th className="px-3 py-3 font-normal">Status</th>
              <th className="px-3 py-3 font-normal">Category</th>
              <th className="px-3 py-3 font-normal">Versions</th>
              <th className="px-3 py-3 font-normal">Featured</th>
              <th className="px-5 py-3 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading && (
              <tr>
                <td colSpan={6} className="p-5"><Skeleton className="h-20" /></td>
              </tr>
            )}
            {q.data?.map((t) => {
              const live = t.versions.find((v) => v.status === 'published')
              const draft = t.versions.find((v) => v.status === 'draft')
              return (
                <tr key={t.id} className="border-b border-rose/40 last:border-0">
                  <td className="px-5 py-3">
                    <Link to={`/admin/templates/${t.id}`} className="flex items-center gap-3 hover:text-kumkum">
                      <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-blush">{t.cover_image_url && <img src={t.cover_image_url.replace(/\.webp$/, '-sm.webp')} alt="" className="size-full object-cover" />}</span>
                      <span>
                        <span className="block font-medium">{t.name}</span>
                        <span className="text-xs text-mist">/{t.slug}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3"><StatusTag status={t.status} /></td>
                  <td className="px-3 text-mist">{t.category?.name ?? '—'}</td>
                  <td className="px-3 text-mist">
                    {live ? `v${live.version} live` : 'none live'}
                    {draft && <span className="ml-2 text-[#7a5300]">v{draft.version} draft</span>}
                  </td>
                  <td className="px-3">
                    <button type="button" onClick={() => patch.mutate({ id: t.id, patch: { is_featured: !t.is_featured } })} aria-pressed={t.is_featured} aria-label={t.is_featured ? 'Unfeature' : 'Feature'} className="grid size-9 place-items-center rounded-full hover:bg-blush">
                      <Star className={t.is_featured ? 'size-4 fill-haldi text-haldi' : 'size-4 text-mist'} />
                    </button>
                  </td>
                  <td className="px-5">
                    <div className="flex justify-end gap-1">
                      {live && (
                        <a href={`/preview/${t.slug}`} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-full hover:bg-blush" aria-label="Preview" title="Preview">
                          <Eye className="size-4" />
                        </a>
                      )}
                      <button type="button" onClick={() => setDuplicating(t)} className="grid size-9 place-items-center rounded-full hover:bg-blush" aria-label="Duplicate" title="Duplicate"><Copy className="size-4" /></button>
                      {t.status === 'published' ? (
                        <button type="button" onClick={() => patch.mutate({ id: t.id, patch: { status: 'archived' } })} className="grid size-9 place-items-center rounded-full hover:bg-blush" aria-label="Archive" title="Archive (hide from catalogue)"><Archive className="size-4" /></button>
                      ) : (
                        <button
                          type="button"
                          disabled={!live}
                          onClick={() => patch.mutate({ id: t.id, patch: { status: 'published' } })}
                          className="grid size-9 place-items-center rounded-full hover:bg-blush disabled:opacity-30"
                          aria-label="Make live"
                          title={live ? 'Make live in catalogue' : 'Publish a version first'}
                        >
                          <Upload className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <NameDialog key={creating ? 'c1' : 'c0'} open={creating} title="New template" initial="" withPreset onClose={() => setCreating(false)} loading={create.isPending} onSubmit={(name, slug, preset) => create.mutate({ name, slug, preset })} />
      {duplicating && <NameDialog open title={`Duplicate ${duplicating.name}`} initial={`${duplicating.name} copy`} onClose={() => setDuplicating(null)} loading={dup.isPending} onSubmit={(name, slug) => dup.mutate({ id: duplicating.id, name, slug })} />}
    </div>
  )
}
