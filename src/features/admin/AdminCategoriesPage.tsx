import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Panel, Skeleton } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import type { TemplateCategoryRow } from '@/types/db'
import { deleteCategory, listCategoriesAdmin, saveCategory } from './api'

type Draft = Partial<TemplateCategoryRow> & { name: string; slug: string }

export default function AdminCategoriesPage() {
  useDocumentMeta({ title: 'Categories · Admin', noindex: true })
  const qc = useQueryClient()
  const toast = useToast()
  const q = useQuery({ queryKey: ['admin-categories'], queryFn: listCategoriesAdmin })
  const [editing, setEditing] = useState<Draft | null>(null)
  const invalidate = () => (qc.invalidateQueries({ queryKey: ['admin-categories'] }), qc.invalidateQueries({ queryKey: ['template-categories'] }))
  const save = useMutation({ mutationFn: (c: Draft) => saveCategory(c), onSuccess: () => (invalidate(), setEditing(null), toast.success('Category saved')), onError: (e) => toast.error(e.message) })
  const remove = useMutation({ mutationFn: deleteCategory, onSuccess: () => (invalidate(), toast.success('Category deleted')), onError: (e) => toast.error(e.message) })
  const valid = editing && editing.name.trim().length >= 2 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(editing.slug)
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-display text-4xl">Categories</h1>
        <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing({ name: '', slug: '', position: (q.data?.length ?? 0) })}>New category</Button>
      </div>
      <Panel>
        {q.isLoading && <Skeleton className="h-40" />}
        <ul className="divide-y divide-rose/60">
          {q.data?.map((c) => (
            <li key={c.id} className="flex items-center gap-4 py-3">
              <div className="flex-1">
                <p className="font-medium">{c.name} <span className="text-sm font-normal text-mist">/{c.slug}</span></p>
                {c.description && <p className="text-sm text-mist">{c.description}</p>}
              </div>
              <span className="text-sm text-mist">{c.templates[0]?.count ?? 0} templates</span>
              <button type="button" onClick={() => setEditing(c)} className="grid size-9 place-items-center rounded-full hover:bg-blush" aria-label={`Edit ${c.name}`}><Pencil className="size-4" /></button>
              <button type="button" onClick={() => remove.mutate(c.id)} className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label={`Delete ${c.name}`}><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      </Panel>
      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit category' : 'New category'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button disabled={!valid} loading={save.isPending} onClick={() => editing && save.mutate(editing)}>Save</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-5">
            <Field label="Name">{(id) => <Input id={id} value={editing.name} maxLength={60} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })} />}</Field>
            <Field label="Slug">{(id) => <Input id={id} value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />}</Field>
            <Field label="Description" optional>{(id) => <Textarea id={id} rows={2} maxLength={400} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />}</Field>
            <Field label="Order">{(id) => <Input id={id} type="number" value={editing.position ?? 0} onChange={(e) => setEditing({ ...editing, position: Number(e.target.value) })} />}</Field>
          </div>
        )}
      </Dialog>
    </div>
  )
}
