import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Clock, ImagePlus, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { EmptyState, Panel, Skeleton } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { iconFor } from '@/features/invitation/engine/sections/Details'
import { formatDate, formatTimeRange } from '@/lib/format'
import { EVENT_KINDS } from '@/lib/languages'
import type { WeddingEventRow } from '@/types/db'
import { deleteEvent, listEvents, reorder, saveEvent, uploadEventImage } from '../../api'
import { useWizard } from '../context'
import { StepFrame } from '../StepFrame'

const opt = (max: number) => z.string().trim().max(max).optional().or(z.literal(''))
const schema = z
  .object({
    name: z.string().trim().min(1, 'Name the event').max(80),
    kind: z.string().regex(/^[a-z_]{1,40}$/),
    description: opt(1000),
    event_date: z.string().optional().or(z.literal('')),
    start_time: z.string().optional().or(z.literal('')),
    end_time: z.string().optional().or(z.literal('')),
    venue_name: opt(160),
    address: opt(400),
    maps_url: z.union([z.literal(''), z.url({ protocol: /^https$/, message: 'Paste a full https:// link' }).max(500)]).optional(),
    dress_code: opt(120),
  })
  .refine((v) => !v.start_time || !v.end_time || v.end_time > v.start_time, { message: 'Ends before it starts', path: ['end_time'] })
type Values = z.infer<typeof schema>
type EventItem = WeddingEventRow & { imageUrl?: string }

const n = (v?: string) => (v && v.trim() ? v.trim() : null)
const KIND_BY_TRADITION: Record<string, string> = { haldi: 'haldi', mehendi: 'mehendi', mehndi: 'mehendi', sangeet: 'sangeet', pellikuthuru: 'pellikuthuru', pellikoduku: 'pellikoduku', nikah: 'nikah', walima: 'reception', reception: 'reception', 'holy matrimony': 'church', 'anand karaj': 'anand_karaj', engagement: 'engagement', roka: 'engagement', manasammatham: 'engagement', mangni: 'engagement' }

function EventDialog({ open, onClose, initial, weddingDefaults, onSave, saving }: { open: boolean; onClose: () => void; initial: Partial<EventItem> | null; weddingDefaults: { date?: string | null; venue?: string | null; address?: string | null }; onSave: (v: Values) => void; saving: boolean }) {
  const { register, handleSubmit, formState, reset } = useForm<Values>({ resolver: zodResolver(schema) })
  useEffect(() => {
    if (!open) return
    reset({
      name: initial?.name ?? '',
      kind: initial?.kind ?? 'other',
      description: initial?.description ?? '',
      event_date: initial?.event_date ?? weddingDefaults.date ?? '',
      start_time: initial?.start_time?.slice(0, 5) ?? '',
      end_time: initial?.end_time?.slice(0, 5) ?? '',
      venue_name: initial?.venue_name ?? (initial?.id ? '' : (weddingDefaults.venue ?? '')),
      address: initial?.address ?? (initial?.id ? '' : (weddingDefaults.address ?? '')),
      maps_url: initial?.maps_url ?? '',
      dress_code: initial?.dress_code ?? '',
    })
  }, [open, initial, reset, weddingDefaults.date, weddingDefaults.venue, weddingDefaults.address])
  const e = formState.errors
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={initial?.id ? 'Edit event' : 'Add an event'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="event-form" loading={saving}>Save event</Button>
        </>
      }
    >
      <form id="event-form" onSubmit={handleSubmit(onSave)} className="grid gap-5 sm:grid-cols-2" noValidate>
        <Field label="Event name" error={e.name?.message}>{(id, d) => <Input id={id} aria-describedby={d} placeholder="Sangeet" {...register('name')} />}</Field>
        <Field label="Type" hint="Sets the icon and colour.">
          {(id, d) => (
            <Select id={id} aria-describedby={d} {...register('kind')}>
              {EVENT_KINDS.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Description" optional className="sm:col-span-2" error={e.description?.message}>{(id) => <Textarea id={id} rows={2} {...register('description')} />}</Field>
        <Field label="Date" error={e.event_date?.message}>{(id) => <Input id={id} type="date" {...register('event_date')} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts" optional>{(id) => <Input id={id} type="time" {...register('start_time')} />}</Field>
          <Field label="Ends" optional error={e.end_time?.message}>{(id) => <Input id={id} type="time" {...register('end_time')} />}</Field>
        </div>
        <Field label="Venue" optional>{(id) => <Input id={id} {...register('venue_name')} />}</Field>
        <Field label="Dress code" optional>{(id) => <Input id={id} placeholder="Shades of yellow" {...register('dress_code')} />}</Field>
        <Field label="Address" optional className="sm:col-span-2">{(id) => <Input id={id} {...register('address')} />}</Field>
        <Field label="Google Maps link" optional className="sm:col-span-2" error={e.maps_url?.message}>{(id, d) => <Input id={id} aria-describedby={d} type="url" inputMode="url" placeholder="https://maps.app.goo.gl/…" {...register('maps_url')} />}</Field>
      </form>
    </Dialog>
  )
}

export default function EventsStep() {
  const { wedding: w, refresh } = useWizard()
  const toast = useToast()
  const qc = useQueryClient()
  const key = ['events', w.id]
  const events = useQuery({ queryKey: key, queryFn: () => listEvents(w.id) })
  const [editing, setEditing] = useState<Partial<EventItem> | null>(null)
  const [deleting, setDeleting] = useState<EventItem | null>(null)
  const fileFor = useRef<{ input: HTMLInputElement | null; event: EventItem | null }>({ input: null, event: null })
  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: key })
    await refresh()
  }

  const save = useMutation({
    mutationFn: (v: Values) =>
      saveEvent(w.id, {
        id: editing?.id,
        name: v.name,
        kind: v.kind,
        description: n(v.description),
        event_date: n(v.event_date),
        start_time: n(v.start_time),
        end_time: n(v.end_time),
        venue_name: n(v.venue_name),
        address: n(v.address),
        maps_url: n(v.maps_url),
        dress_code: n(v.dress_code),
        icon: null,
      }),
    onSuccess: async () => (await invalidate(), setEditing(null), toast.success('Event saved')),
    onError: (e) => toast.error(e.message),
  })
  const remove = useMutation({ mutationFn: (e: EventItem) => deleteEvent(e), onSuccess: async () => (await invalidate(), setDeleting(null), toast.success('Event removed')), onError: (e) => toast.error(e.message) })
  const image = useMutation({ mutationFn: ({ e, f }: { e: EventItem; f: File }) => uploadEventImage(w, e.id, f, e.image_path), onSuccess: async () => (await invalidate(), toast.success('Image added')), onError: (e) => toast.error(e.message) })
  const shift = async (i: number, d: number) => {
    const ids = events.data!.map((e) => e.id)
    ;[ids[i], ids[i + d]] = [ids[i + d], ids[i]]
    await reorder('wedding_events', ids).catch((e: Error) => toast.error(e.message))
    await invalidate()
  }

  const existing = new Set(events.data?.map((e) => e.name.toLowerCase()))
  const quick = w.traditions.filter((t) => !existing.has(t.toLowerCase())).slice(0, 10)

  return (
    <StepFrame title="Events" description="Add every ceremony guests are invited to — each gets directions and an add-to-calendar button." continueLabel="Continue" aside={<Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing({})}>Add event</Button>}>
      {quick.length > 0 && (
        <Panel className="mb-6" title="Quick add" description="From the ceremonies you selected.">
          <div className="flex flex-wrap gap-2">
            {quick.map((t) => (
              <button key={t} type="button" onClick={() => setEditing({ name: t, kind: KIND_BY_TRADITION[t.toLowerCase()] ?? (/wedding|muhurtham|pheras|vivah|kalyanam/i.test(t) ? 'wedding' : 'other') })} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-sm ring-1 ring-rose hover:ring-plum/40">
                <Plus className="size-3.5" aria-hidden /> {t}
              </button>
            ))}
          </div>
        </Panel>
      )}
      {events.isLoading && <Skeleton className="h-40" />}
      {events.data?.length === 0 && <EmptyState title="No events yet" body="Most weddings have three to six. Add them in the order guests should see them." action={<Button onClick={() => setEditing({ name: 'Wedding', kind: 'wedding' })}>Add the wedding ceremony</Button>} />}
      <ol className="space-y-3">
        {events.data?.map((e, i) => {
          const Icon = iconFor({ ...e, id: e.id, kind: e.kind, name: e.name })
          return (
            <li key={e.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-rose/70">
              <button type="button" onClick={() => ((fileFor.current.event = e), fileFor.current.input?.click())} className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-blush text-kumkum" aria-label={`Add an image for ${e.name}`}>
                {e.imageUrl ? <img src={e.imageUrl} alt="" className="size-full object-cover" /> : <Icon className="size-6" aria-hidden />}
                <span className="absolute right-0.5 bottom-0.5 rounded-full bg-white p-0.5"><ImagePlus className="size-3" aria-hidden /></span>
              </button>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold">{e.name}</h3>
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-mist">
                  <span>{e.event_date ? formatDate(e.event_date, 'EEE, d MMM yyyy') : 'No date'}</span>
                  {(e.start_time || e.end_time) && <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />{formatTimeRange(e.start_time, e.end_time)}</span>}
                  {e.venue_name && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{e.venue_name}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" disabled={i === 0} onClick={() => void shift(i, -1)} className="grid size-9 place-items-center rounded-full hover:bg-blush disabled:opacity-30" aria-label="Move up"><ChevronUp className="size-4" /></button>
                <button type="button" disabled={i === events.data!.length - 1} onClick={() => void shift(i, 1)} className="grid size-9 place-items-center rounded-full hover:bg-blush disabled:opacity-30" aria-label="Move down"><ChevronDown className="size-4" /></button>
                <button type="button" onClick={() => setEditing(e)} className="grid size-9 place-items-center rounded-full hover:bg-blush" aria-label={`Edit ${e.name}`}><Pencil className="size-4" /></button>
                <button type="button" onClick={() => setDeleting(e)} className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger/10" aria-label={`Delete ${e.name}`}><Trash2 className="size-4" /></button>
              </div>
            </li>
          )
        })}
      </ol>
      <input
        ref={(el) => {
          fileFor.current.input = el
        }}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(ev) => {
          const f = ev.target.files?.[0]
          if (f && fileFor.current.event) image.mutate({ e: fileFor.current.event, f })
          ev.target.value = ''
        }}
      />
      <EventDialog open={editing !== null} onClose={() => setEditing(null)} initial={editing} weddingDefaults={{ date: w.wedding_date, venue: w.venue_name, address: w.venue_address }} onSave={(v) => save.mutate(v)} saving={save.isPending} />
      <ConfirmDialog open={Boolean(deleting)} title={`Delete ${deleting?.name}?`} body="Guests will no longer see this event." confirmLabel="Delete event" danger loading={remove.isPending} onConfirm={() => deleting && remove.mutate(deleting)} onClose={() => setDeleting(null)} />
    </StepFrame>
  )
}
