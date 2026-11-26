import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Field, Input, Switch } from '@/components/ui/Field'
import { Badge, Panel, Skeleton } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { Dropzone, UploadQueue, useUploadQueue } from '@/features/media/Dropzone'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { deleteLibraryItem, listLibrary, updateLibraryItem, uploadLibraryTrack } from './api'

export default function AdminLibraryPage() {
  useDocumentMeta({ title: 'Music library · Admin', noindex: true })
  const qc = useQueryClient()
  const toast = useToast()
  const q = useQuery({ queryKey: ['admin-library'], queryFn: listLibrary })
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const queue = useUploadQueue()
  const invalidate = () => (qc.invalidateQueries({ queryKey: ['admin-library'] }), qc.invalidateQueries({ queryKey: ['library-tracks'] }))
  const patch = useMutation({ mutationFn: (a: { id: string; is_active?: boolean; title?: string }) => updateLibraryItem(a.id, a), onSuccess: invalidate, onError: (e) => toast.error(e.message) })
  const remove = useMutation({ mutationFn: deleteLibraryItem, onSuccess: () => (invalidate(), toast.success('Track deleted')), onError: (e) => toast.error(e.message) })
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-4xl">Music library</h1>
      <Panel title="Add a track" description="Only add music you hold the rights to distribute royalty-free. Tracks appear in every customer’s music step.">
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <Field label="Title">{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />}</Field>
          <Field label="Description" optional>{(id) => <Input id={id} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />}</Field>
        </div>
        <Dropzone accept="audio/mpeg,audio/mp4,audio/ogg" onFiles={(f) => void queue.run(f.slice(0, 1), (file) => uploadLibraryTrack(file, title, description)).then(() => (setTitle(''), setDescription(''), invalidate()))} title="Drop an audio file" hint="MP3, M4A or OGG, up to 20 MB." />
        <UploadQueue jobs={queue.jobs} />
      </Panel>
      <Panel title="Tracks">
        {q.isLoading && <Skeleton className="h-32" />}
        <ul className="space-y-3">
          {q.data?.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-paper p-4 ring-1 ring-rose/70">
              <div className="min-w-48 flex-1">
                <p className="font-medium">{t.title} {t.public_url && <Badge className="ml-1">Bundled</Badge>}</p>
                {t.description && <p className="text-sm text-mist">{t.description}</p>}
              </div>
              <audio src={t.url} controls preload="none" className="h-10 max-w-full" />
              <Switch checked={t.is_active} onChange={(v) => patch.mutate({ id: t.id, is_active: v })} label="Available" />
              <button type="button" onClick={() => remove.mutate(t)} className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label={`Delete ${t.title}`}><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
