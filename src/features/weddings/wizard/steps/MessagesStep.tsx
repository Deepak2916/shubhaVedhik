import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { EmptyState, Tabs } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/format'
import { languageName } from '@/lib/languages'
import type { MessageKind } from '@/lib/validation/template'
import type { WeddingMessageRow } from '@/types/db'
import { deleteMessage, listMessages, listPhotos, saveMessage, type MessageInput } from '../../api'
import { useWizard } from '../context'
import { StepFrame } from '../StepFrame'

const KINDS: { value: MessageKind; label: string; help: string; placeholder: string }[] = [
  { value: 'invitation', label: 'Invitation', help: 'Overrides the main invitation text from Basic details, per language.', placeholder: 'With the blessings of our elders, we invite you…' },
  { value: 'welcome', label: 'Welcome', help: 'A short greeting for guests.', placeholder: 'Welcome to our wedding celebrations!' },
  { value: 'story', label: 'Our story', help: 'Milestones shown as a timeline — add a date and photo to each.', placeholder: 'We met at a cousin’s wedding in 2019…' },
  { value: 'family', label: 'Family message', help: 'From parents or grandparents.', placeholder: 'Darshanabhilashi: the entire Sharma parivar' },
  { value: 'blessings', label: 'Blessings', help: 'A verse, prayer or request for blessings.', placeholder: 'Love is patient, love is kind…' },
  { value: 'custom', label: 'Custom', help: 'Anything else — travel notes, gift preferences, hashtags.', placeholder: 'Our wedding hashtag is #KabirMeetsMeera' },
  { value: 'thankyou', label: 'Thank you', help: 'Shown at the end of the invitation.', placeholder: 'Your presence is our blessing.' },
]

export default function MessagesStep() {
  const { wedding: w, refresh } = useWizard()
  const toast = useToast()
  const qc = useQueryClient()
  const key = ['messages', w.id]
  const messages = useQuery({ queryKey: key, queryFn: () => listMessages(w.id) })
  const photos = useQuery({ queryKey: ['photos', w.id], queryFn: () => listPhotos(w.id) })
  const [kind, setKind] = useState<MessageKind>('invitation')
  const [editing, setEditing] = useState<MessageInput | null>(null)
  const meta = KINDS.find((k) => k.value === kind)!
  const list = (messages.data ?? []).filter((m) => m.kind === kind)
  const langs = w.languages.length ? w.languages : ['en']

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: key })
    await refresh()
  }
  const save = useMutation({
    mutationFn: (m: MessageInput) => saveMessage(w.id, { ...m, title: m.title?.trim() || null, body: m.body.trim() }),
    onSuccess: async () => (await invalidate(), setEditing(null), toast.success('Message saved')),
    onError: (e) => toast.error(e.message),
  })
  const remove = useMutation({ mutationFn: (id: string) => deleteMessage(id), onSuccess: invalidate, onError: (e) => toast.error(e.message) })
  const edit = (m: WeddingMessageRow) => setEditing({ id: m.id, kind: m.kind, language: m.language, title: m.title, body: m.body, meta: m.meta ?? {} })

  return (
    <StepFrame title="Messages" description="Words for every part of the invitation, in each of your languages. All optional." continueLabel="Continue">
      <Tabs tabs={KINDS.map((k) => ({ value: k.value, label: k.label }))} value={kind} onChange={setKind} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-mist">{meta.help}</p>
        <Button size="sm" icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing({ kind, language: langs[0], title: null, body: '', meta: {} })}>
          Add {meta.label.toLowerCase()}
        </Button>
      </div>
      <ul className="mt-5 space-y-3">
        {list.map((m) => (
          <li key={m.id} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-rose/70">
            <div className="min-w-0 flex-1" lang={m.language}>
              <p className="text-xs text-mist">
                {languageName(m.language)}
                {m.meta?.date && ` — ${formatDate(m.meta.date, 'MMMM yyyy')}`}
              </p>
              {m.title && <p className="mt-1 font-semibold">{m.title}</p>}
              <p className="mt-1 line-clamp-3 whitespace-pre-line text-plum-soft">{m.body}</p>
            </div>
            <div className="flex shrink-0 items-start gap-1">
              <button type="button" onClick={() => edit(m)} className="grid size-9 place-items-center rounded-full hover:bg-blush" aria-label="Edit message"><Pencil className="size-4" /></button>
              <button type="button" onClick={() => remove.mutate(m.id)} className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label="Delete message"><Trash2 className="size-4" /></button>
            </div>
          </li>
        ))}
      </ul>
      {!messages.isLoading && list.length === 0 && <div className="mt-5"><EmptyState title={`No ${meta.label.toLowerCase()} yet`} body="Designs that show this section use their own wording until you add yours." /></div>}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit message' : `Add ${meta.label.toLowerCase()}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button loading={save.isPending} disabled={!editing?.body.trim()} onClick={() => editing && save.mutate(editing)}>Save message</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Language">
                {(id) => (
                  <Select id={id} value={editing.language} onChange={(e) => setEditing({ ...editing, language: e.target.value })}>
                    {langs.map((l) => <option key={l} value={l}>{languageName(l)}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Title" optional>{(id) => <Input id={id} maxLength={160} value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />}</Field>
            </div>
            <Field label="Message" hint={`${editing.body.length} / 5000`}>
              {(id, d) => <Textarea id={id} aria-describedby={d} rows={6} maxLength={5000} lang={editing.language} placeholder={meta.placeholder} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />}
            </Field>
            {editing.kind === 'story' && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="When" optional>{(id) => <Input id={id} type="date" value={editing.meta.date ?? ''} onChange={(e) => setEditing({ ...editing, meta: { ...editing.meta, date: e.target.value || undefined } })} />}</Field>
                <Field label="Photo" optional>
                  {(id) => (
                    <Select id={id} value={editing.meta.photoId ?? ''} onChange={(e) => setEditing({ ...editing, meta: { ...editing.meta, photoId: e.target.value || undefined } })}>
                      <option value="">No photo</option>
                      {photos.data?.map((p, i) => <option key={p.id} value={p.id}>{p.caption || `Photo ${i + 1}`}</option>)}
                    </Select>
                  )}
                </Field>
                {editing.meta.photoId && <img src={photos.data?.find((p) => p.id === editing.meta.photoId)?.thumbUrl} alt="" className="h-32 rounded-xl object-cover sm:col-span-2" />}
              </div>
            )}
          </div>
        )}
      </Dialog>
    </StepFrame>
  )
}
