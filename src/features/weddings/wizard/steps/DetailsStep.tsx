import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Panel } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { env } from '@/lib/env'
import { isSlugAvailable, updateWedding } from '../../api'
import { useWizard } from '../context'
import { StepFrame } from '../StepFrame'

const opt = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`).optional().or(z.literal(''))

const schema = z.object({
  bride_name: z.string().trim().min(1, 'Required').max(80),
  groom_name: z.string().trim().min(1, 'Required').max(80),
  bride_parents: opt(200),
  groom_parents: opt(200),
  wedding_date: z.string().optional().or(z.literal('')),
  wedding_time: z.string().optional().or(z.literal('')),
  city: opt(120),
  venue_name: opt(160),
  venue_address: opt(400),
  maps_url: z.union([z.literal(''), z.url({ protocol: /^https$/, message: 'Paste a full https:// link from Google Maps' }).max(500)]).optional(),
  couple_intro: opt(2000),
  invitation_message: opt(2000),
  slug: z.string().trim().toLowerCase().min(3, 'At least 3 characters').max(60).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens'),
})
type Values = z.infer<typeof schema>

const nullIfEmpty = (v?: string) => (v && v.trim() ? v.trim() : null)

export default function DetailsStep() {
  const { wedding: w, refresh } = useWizard()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const slugLocked = w.status !== 'draft' || Boolean(w.published_at)
  const { register, handleSubmit, formState, setError } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      bride_name: w.bride_name,
      groom_name: w.groom_name,
      bride_parents: w.bride_parents ?? '',
      groom_parents: w.groom_parents ?? '',
      wedding_date: w.wedding_date ?? '',
      wedding_time: w.wedding_time?.slice(0, 5) ?? '',
      city: w.city ?? '',
      venue_name: w.venue_name ?? '',
      venue_address: w.venue_address ?? '',
      maps_url: w.maps_url ?? '',
      couple_intro: w.couple_intro ?? '',
      invitation_message: w.invitation_message ?? '',
      slug: w.slug,
    },
  })
  const e = formState.errors

  const save = () =>
    new Promise<boolean>((resolve) => {
      void handleSubmit(
        async (v) => {
          setSaving(true)
          try {
            if (!slugLocked && v.slug !== w.slug && !(await isSlugAvailable(v.slug, w.id))) {
              setError('slug', { message: 'That link is taken — try adding your city or the year' })
              return resolve(false)
            }
            await updateWedding(w.id, {
              bride_name: v.bride_name,
              groom_name: v.groom_name,
              bride_parents: nullIfEmpty(v.bride_parents),
              groom_parents: nullIfEmpty(v.groom_parents),
              wedding_date: nullIfEmpty(v.wedding_date),
              wedding_time: nullIfEmpty(v.wedding_time),
              city: nullIfEmpty(v.city),
              venue_name: nullIfEmpty(v.venue_name),
              venue_address: nullIfEmpty(v.venue_address),
              maps_url: nullIfEmpty(v.maps_url),
              couple_intro: nullIfEmpty(v.couple_intro),
              invitation_message: nullIfEmpty(v.invitation_message),
              ...(slugLocked ? {} : { slug: v.slug }),
            })
            await refresh()
            toast.success('Details saved')
            resolve(true)
          } catch (err) {
            toast.error((err as Error).message)
            resolve(false)
          } finally {
            setSaving(false)
          }
        },
        () => resolve(false),
      )()
    })

  const input = (name: keyof Values, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, extra: { hint?: string; optional?: boolean } = {}) => (
    <Field label={label} error={e[name]?.message} hint={extra.hint} optional={extra.optional}>
      {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={Boolean(e[name])} {...props} {...register(name)} />}
    </Field>
  )

  return (
    <StepFrame title="The couple and the big day" description="These details appear on the invitation. Only the names, date and venue are needed to publish." onContinue={save} saving={saving} hideBack>
      <form className="space-y-6" onSubmit={(ev) => (ev.preventDefault(), void save())} noValidate>
        <Panel title="Couple">
          <div className="grid gap-5 sm:grid-cols-2">
            {input('bride_name', 'Bride’s full name', { autoComplete: 'off' })}
            {input('groom_name', 'Groom’s full name', { autoComplete: 'off' })}
            {input('bride_parents', 'Bride’s parents', { placeholder: 'Smt. Lalitha & Sri Srinivasa Murthy' }, { optional: true })}
            {input('groom_parents', 'Groom’s parents', { placeholder: 'Smt. Padmavathi & Sri Venkata Ramana Rao' }, { optional: true })}
          </div>
        </Panel>
        <Panel title="When and where">
          <div className="grid gap-5 sm:grid-cols-2">
            {input('wedding_date', 'Wedding date', { type: 'date' })}
            {input('wedding_time', 'Muhurtham / ceremony time', { type: 'time' }, { optional: true })}
            {input('venue_name', 'Venue name', { placeholder: 'Sri Raghavendra Kalyana Mandapam' })}
            {input('city', 'City', { placeholder: 'Hyderabad' }, { optional: true })}
            <div className="sm:col-span-2">{input('venue_address', 'Full venue address', {}, { optional: true })}</div>
            <div className="sm:col-span-2">{input('maps_url', 'Google Maps link', { type: 'url', inputMode: 'url', placeholder: 'https://maps.app.goo.gl/…' }, { optional: true, hint: 'In Google Maps, tap Share and copy the link. Without one, we’ll search for the address.' })}</div>
          </div>
        </Panel>
        <Panel title="Words">
          <div className="space-y-5">
            <Field label="Invitation message" optional error={e.invitation_message?.message} hint="The main lines of your invitation. Leave empty to use the design’s default wording.">
              {(id, d) => <Textarea id={id} aria-describedby={d} rows={4} placeholder="Together with our families, we joyfully invite you…" {...register('invitation_message')} />}
            </Field>
            <Field label="About the couple" optional error={e.couple_intro?.message}>
              {(id, d) => <Textarea id={id} aria-describedby={d} rows={4} placeholder="How you met, what you love, what guests should know…" {...register('couple_intro')} />}
            </Field>
          </div>
        </Panel>
        <Panel title="Invitation link" description={slugLocked ? 'The link is fixed once an invitation has been published, so printed QR codes keep working.' : 'Choose carefully — it’s printed in your QR code.'}>
          <Field label="Link" error={e.slug?.message}>
            {(id, d) => (
              <div className="flex items-center overflow-hidden rounded-[10px] bg-white ring-1 ring-rose focus-within:ring-2 focus-within:ring-kumkum/50">
                <span className="hidden shrink-0 pl-3.5 text-mist sm:block">{env.siteUrl.replace(/^https?:\/\//, '')}/w/</span>
                <input id={id} aria-describedby={d} disabled={slugLocked} className="h-11 min-w-0 flex-1 bg-transparent px-3.5 outline-none disabled:text-mist sm:pl-0.5" {...register('slug')} />
              </div>
            )}
          </Field>
        </Panel>
      </form>
    </StepFrame>
  )
}
