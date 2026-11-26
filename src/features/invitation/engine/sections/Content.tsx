import { Quote } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatTime, initials } from '@/lib/format'
import { useInvitation } from '../context'
import { MOTIFS } from '../motifs'
import { Kalash } from '../motifs/shapes'
import { Reveal, SectionShell, SectionTitle } from '../Section'
import type { SectionProps } from './Hero'

function useKit() {
  const ctx = useInvitation()
  return { ...ctx, kit: MOTIFS[ctx.config.theme.motif] }
}

function DetailTriplet({ className, labels = ['Date', 'Time', 'Venue'] }: { className?: string; labels?: [string, string, string] | string[] }) {
  const { data } = useInvitation()
  const items = [
    { label: labels[0], value: formatDate(data.date, 'EEE, d MMM yyyy') },
    { label: labels[1], value: formatTime(data.time) },
    { label: labels[2], value: [data.venueName, data.city].filter(Boolean).join(', ') },
  ].filter((i) => i.value)
  return (
    <dl className={cn('grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-inv-primary/30', className)}>
      {items.map((i) => (
        <div key={i.label} className="px-4 text-center">
          <dt className="text-xs tracking-[0.25em] text-inv-muted uppercase">{i.label}</dt>
          <dd className="inv-display mt-2 text-xl leading-snug">{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}

// ---------------------------------------------------------------------------
export function InvitationSection({ id, config }: SectionProps) {
  const { t, sacred, kit, data, names, invitationMessage, lang } = useKit()
  const variant = config.variant ?? 'scroll-card'
  const localMsg = lang === 'en' ? data.localized[data.languages.find((l) => l !== 'en') ?? '']?.invitationMessage : undefined
  const parents = [data.groomParents, data.brideParents].filter(Boolean)

  if (variant === 'statement') {
    return (
      <SectionShell id={id} config={config} label="Invitation">
        <div className="grid gap-10 lg:grid-cols-[0.35fr_1fr]">
          <p className="text-xs tracking-[0.4em] text-inv-muted uppercase">{t(config.title)}</p>
          <div>
            <p className="inv-display text-[clamp(1.9rem,4.4vw,3.6rem)] leading-[1.1]">{invitationMessage}</p>
            <DetailTriplet className="mt-14 border-t border-inv-text/15 pt-8 sm:text-left sm:[&_div]:text-left" />
          </div>
        </div>
      </SectionShell>
    )
  }

  if (variant === 'title-card') {
    return (
      <SectionShell id={id} config={config} label="Invitation" className="text-center">
        <p className="text-xs tracking-[0.5em] text-inv-primary uppercase">{t(config.title)}</p>
        <p className="mx-auto mt-8 max-w-2xl text-[clamp(1.3rem,2.6vw,1.8rem)] leading-relaxed italic">{invitationMessage}</p>
        <div className="mx-auto mt-12 grid max-w-3xl gap-px overflow-hidden border border-inv-text/15 bg-inv-text/15 sm:grid-cols-3">
          {[
            ['Release date', formatDate(data.date, 'd MMMM yyyy')],
            ['Showtime', formatTime(data.time)],
            ['Theatre', data.venueName ?? ''],
          ].map(([k, v]) => (
            <div key={k} className="bg-inv-surface px-5 py-6">
              <p className="text-[0.65rem] tracking-[0.4em] text-inv-muted uppercase">{k}</p>
              <p className="inv-display mt-2 text-2xl tracking-wide uppercase">{v}</p>
            </div>
          ))}
        </div>
      </SectionShell>
    )
  }

  if (variant === 'order-of-service') {
    const rows = [
      ['Ceremony', 'Holy Matrimony'],
      ['Date', formatDate(data.date)],
      ['Time', formatTime(data.time)],
      ['Church', data.venueName ?? ''],
      ['Address', data.venueAddress ?? data.city ?? ''],
    ].filter(([, v]) => v)
    return (
      <SectionShell id={id} config={config} label="Invitation">
        <div className="tex-paper relative mx-auto max-w-2xl bg-inv-bg px-6 py-12 text-center shadow-[0_30px_60px_-40px_rgb(74_59_47/0.5)] ring-1 ring-inv-border sm:px-14">
          {kit.Corner({ className: 'absolute top-0 left-0 w-20' })}
          {kit.Corner({ className: 'absolute top-0 right-0 w-20', flip: true })}
          <p className="text-xs tracking-[0.35em] text-inv-muted uppercase">Order of service</p>
          <h2 className="inv-display mt-3 text-4xl">{t(config.title)}</h2>
          {kit.Divider({ className: 'my-6' })}
          <p className="mx-auto max-w-md leading-relaxed text-inv-muted italic">{invitationMessage}</p>
          <dl className="mt-10 space-y-3 text-left">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-3">
                <dt className="text-sm tracking-[0.15em] text-inv-muted uppercase">{k}</dt>
                <span className="flex-1 border-b border-dotted border-inv-border" aria-hidden />
                <dd className="max-w-[60%] text-right">{v}</dd>
              </div>
            ))}
          </dl>
          {parents.length > 0 && <p className="mt-10 text-sm text-inv-muted">With the blessings of {parents.join(' and ')}</p>}
        </div>
      </SectionShell>
    )
  }

  if (variant === 'ganesha-card') {
    return (
      <SectionShell id={id} config={config} label="Invitation">
        <div className="tex-paper relative mx-auto max-w-3xl rounded-[28px] bg-inv-bg px-6 py-12 text-center ring-4 ring-inv-accent/60 ring-offset-4 ring-offset-inv-surface sm:px-14">
          <Kalash size={64} className="mx-auto" />
          <p className="inv-accent-font mt-3 text-lg text-inv-primary">{sacred(config.eyebrow) || sacred('॥ श्री गणेशाय नमः ॥')}</p>
          <h2 className="inv-display mt-4 text-[clamp(1.8rem,4.5vw,2.8rem)] text-inv-primary">{t(config.title)}</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed">{invitationMessage}</p>
          {localMsg && <p className="inv-accent-font mx-auto mt-4 max-w-xl text-lg leading-relaxed text-inv-muted">{localMsg}</p>}
          {kit.Divider({ className: 'my-8' })}
          <p className="inv-display text-3xl">
            {names.bride} <span className="text-inv-accent">&</span> {names.groom}
          </p>
          <DetailTriplet className="mt-10" />
        </div>
      </SectionShell>
    )
  }

  // scroll-card & centered-ornate share structure; differ in frame treatment
  const ornate = variant === 'centered-ornate'
  return (
    <SectionShell id={id} config={config} label="Invitation">
      <div className={cn('relative mx-auto max-w-3xl px-6 py-14 text-center sm:px-14', ornate ? 'border border-inv-primary/50' : 'rounded-[4px] border-[3px] border-double border-inv-primary/70')}>
        {kit.Corner({ className: 'absolute -top-1 -left-1 w-16 sm:w-20' })}
        {kit.Corner({ className: 'absolute -top-1 -right-1 w-16 sm:w-20', flip: true })}
        {ornate && <div className="pointer-events-none absolute inset-2 border border-inv-primary/25" aria-hidden />}
        {config.eyebrow && <p className="inv-accent-font text-lg text-inv-accent">{sacred(config.eyebrow)}</p>}
        <h2 className="inv-display inv-display-cased mt-3 text-[clamp(1.6rem,4vw,2.4rem)] text-inv-primary">{t(config.title)}</h2>
        {kit.Divider({ className: 'my-6' })}
        <p className="mx-auto max-w-xl text-lg leading-relaxed">{invitationMessage}</p>
        {localMsg && <p className="inv-accent-font mx-auto mt-5 max-w-xl text-lg leading-loose text-inv-muted">{localMsg}</p>}
        <DetailTriplet className="mt-12" />
      </div>
    </SectionShell>
  )
}

// ---------------------------------------------------------------------------
export function MessageSection({ id, config }: SectionProps) {
  const { t, messagesOf, kit } = useKit()
  const messages = messagesOf(config.messageKind ?? 'custom')
  if (messages.length === 0 && !config.body) return null
  const variant = config.variant ?? 'centered'
  const list = messages.length ? messages : [{ id: 'cfg', title: config.title ?? null, body: config.body ?? '' }]
  return (
    <SectionShell id={id} config={config} label={config.title ?? 'Message'} defaultBackground="surface">
      <SectionTitle eyebrow={config.eyebrow} title={messages.length ? undefined : config.title} />
      <div className="mx-auto max-w-3xl space-y-12 text-center">
        {list.map((m) => (
          <Reveal key={m.id}>
            {variant === 'quote' ? (
              <figure>
                <Quote className="mx-auto mb-5 size-8 text-inv-primary" aria-hidden />
                <blockquote className="inv-display text-[clamp(1.4rem,3.2vw,2.2rem)] leading-snug">{t(m.body)}</blockquote>
                {m.title && <figcaption className="mt-5 text-sm tracking-[0.2em] text-inv-muted uppercase">{m.title}</figcaption>}
              </figure>
            ) : variant === 'letter' ? (
              <div className="tex-paper mx-auto max-w-xl bg-inv-bg p-8 text-left shadow-md ring-1 ring-inv-border">
                {m.title && <h3 className="inv-display mb-3 text-2xl">{m.title}</h3>}
                <p className="leading-relaxed whitespace-pre-line">{t(m.body)}</p>
              </div>
            ) : (
              <div>
                {m.title && <h3 className="inv-display mb-4 text-3xl">{m.title}</h3>}
                <p className="text-lg leading-relaxed whitespace-pre-line">{t(m.body)}</p>
                {kit.Divider({ className: 'mt-8' })}
              </div>
            )}
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}

// ---------------------------------------------------------------------------
export function FamilySection({ id, config }: SectionProps) {
  const { t, data, names, messagesOf, kit } = useKit()
  const family = messagesOf('family')
  if (!data.groomParents && !data.brideParents && family.length === 0) return null
  const sides = [
    { label: 'The bride’s family', who: names.bride, parents: data.brideParents },
    { label: 'The groom’s family', who: names.groom, parents: data.groomParents },
  ].filter((s) => s.parents)
  return (
    <SectionShell id={id} config={config} label="Families">
      <SectionTitle eyebrow={config.eyebrow} title={config.title} subtitle={config.subtitle} />
      {config.variant === 'centered' ? (
        <div className="mx-auto max-w-2xl space-y-6 text-center">
          {sides.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1}>
              <p className="inv-display text-2xl sm:text-3xl">{s.parents}</p>
              <p className="mt-1 text-sm text-inv-muted">{i === 0 ? 'parents of the bride' : 'parents of the groom'}</p>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-2">
          {sides.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1} className="text-center">
              {kit.Glyph({ className: 'mx-auto mb-4' })}
              <p className="text-xs tracking-[0.3em] text-inv-muted uppercase">{s.label}</p>
              <p className="inv-display mt-3 text-2xl leading-snug">{s.parents}</p>
              <p className="mt-2 text-inv-muted italic">request the pleasure of your company</p>
            </Reveal>
          ))}
        </div>
      )}
      {family.map((m) => (
        <Reveal key={m.id} className="mx-auto mt-12 max-w-2xl text-center">
          {m.title && <p className="text-sm tracking-[0.25em] text-inv-primary uppercase">{t(m.title)}</p>}
          <p className="mt-2 text-lg">{t(m.body)}</p>
        </Reveal>
      ))}
    </SectionShell>
  )
}

// ---------------------------------------------------------------------------
export function ClosingSection({ id, config }: SectionProps) {
  const { t, data, names, messagesOf, kit, sacred } = useKit()
  const thanks = messagesOf('thankyou')[0]
  const variant = config.variant ?? 'blessing'

  if (variant === 'end-credits') {
    const credits: [string, string][] = [
      ['Starring', `${names.bride} & ${names.groom}`],
      ['The bride’s family', data.brideParents ?? ''],
      ['The groom’s family', data.groomParents ?? ''],
      ['Location', [data.venueName, data.city].filter(Boolean).join(', ')],
      ['Premiere', formatDate(data.date)],
    ]
    return (
      <SectionShell id={id} config={config} label="Closing" className="text-center">
        <div className="mx-auto max-w-xl space-y-8">
          {credits
            .filter(([, v]) => v)
            .map(([k, v], i) => (
              <Reveal key={k} delay={i * 0.08}>
                <p className="text-[0.65rem] tracking-[0.45em] text-inv-muted uppercase">{k}</p>
                <p className="inv-display mt-1 text-2xl tracking-wide uppercase">{v}</p>
              </Reveal>
            ))}
          {thanks && <p className="pt-6 text-inv-muted italic">{t(thanks.body)}</p>}
          <p className="inv-display pt-10 text-[clamp(2.4rem,8vw,5rem)] leading-none text-inv-primary uppercase">{t(config.title)}</p>
        </div>
      </SectionShell>
    )
  }

  if (variant === 'monogram') {
    return (
      <SectionShell id={id} config={config} label="Closing" className="text-center">
        <div className="mx-auto grid size-40 place-items-center rounded-full border border-inv-text/30">
          <span className="inv-display text-5xl tracking-[0.1em]">{initials(names.bride, names.groom).split('').join(' ')}</span>
        </div>
        <p className="inv-display mx-auto mt-10 max-w-2xl text-[clamp(1.6rem,4vw,2.8rem)] leading-tight">{t(config.title)}</p>
        {thanks && <p className="mt-6 text-inv-muted">{t(thanks.body)}</p>}
        <p className="mt-10 text-xs tracking-[0.4em] text-inv-muted uppercase">{formatDate(data.date, 'dd.MM.yyyy')} — {data.city}</p>
      </SectionShell>
    )
  }

  const dua = variant === 'dua'
  return (
    <SectionShell id={id} config={config} label="Closing" className="overflow-hidden text-center">
      {kit.Backdrop?.({ className: 'pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[560px] -translate-x-1/2 -translate-y-1/2 opacity-25', spin: config.ornament !== false })}
      {kit.Header && variant === 'rangoli' && kit.Header({ className: 'absolute inset-x-0 top-0' })}
      <div className="mx-auto max-w-2xl">
        {dua && sacred('آمين') && <p className="inv-accent-font text-3xl text-inv-accent" dir="rtl">بَارَكَ ٱللَّٰهُ لَكُمَا</p>}
        {kit.Divider({ className: 'mb-8' })}
        <h2 className="inv-display inv-display-cased text-[clamp(1.8rem,5vw,3.2rem)] leading-tight">{t(config.title)}</h2>
        {config.subtitle && <p className="inv-accent-font mt-4 text-xl text-inv-muted">{t(config.subtitle)}</p>}
        {thanks && <p className="mx-auto mt-8 max-w-lg text-lg leading-relaxed">{t(thanks.body)}</p>}
        <p className={cn('mt-12 text-[clamp(2rem,6vw,3.4rem)] text-inv-primary', variant === 'verse' ? 'inv-script' : 'inv-display')}>
          {names.bride} &amp; {names.groom}
        </p>
        <p className="mt-3 text-sm tracking-[0.25em] text-inv-muted uppercase">{formatDate(data.date, 'd MMMM yyyy')}</p>
      </div>
    </SectionShell>
  )
}
