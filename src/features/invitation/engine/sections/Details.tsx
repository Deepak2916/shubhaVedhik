import { CalendarHeart, CalendarPlus, Church, Clock, Crown, Flame, Flower2, Gem, Leaf, MapPin, Moon, Music, Navigation, Shirt, Sparkles, Sun, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { combineDateTime, countdownTo, formatDate, formatTimeRange } from '@/lib/format'
import type { InvitationEvent } from '@/lib/validation/invitation'
import { useInvitation } from '../context'
import { MOTIFS } from '../motifs'
import { clipStyle } from '../motifs/shapes'
import { Reveal, SectionShell, SectionTitle } from '../Section'
import type { SectionProps } from './Hero'

const KIND_ICON: Record<string, LucideIcon> = {
  engagement: Gem,
  haldi: Sun,
  mehendi: Leaf,
  sangeet: Music,
  pellikuthuru: Flower2,
  pellikoduku: Crown,
  wedding: Flame,
  nikah: Moon,
  church: Church,
  anand_karaj: Sun,
  reception: Sparkles,
}
const KIND_COLOR: Record<string, string> = {
  haldi: '#F2B705',
  mehendi: '#3E8E41',
  sangeet: '#C81D63',
  wedding: '#B3141E',
  nikah: '#0F6B4F',
  reception: '#5B2A86',
  engagement: '#1F5FA8',
  pellikuthuru: '#E07A00',
  pellikoduku: '#8A5A00',
  church: '#7F8F70',
}

export const iconFor = (e: InvitationEvent) => KIND_ICON[e.kind] ?? CalendarHeart

export function directionsUrl(mapsUrl?: string | null, address?: string | null): string | null {
  if (mapsUrl) return mapsUrl
  if (!address) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function calendarUrl(e: InvitationEvent, title: string): string | null {
  if (!e.date) return null
  const ymd = e.date.replaceAll('-', '')
  const hm = (t?: string | null) => (t ? t.replace(':', '').padEnd(4, '0') + '00' : '')
  let dates: string
  if (e.startTime) {
    const end = e.endTime ?? `${String(Math.min(23, Number(e.startTime.slice(0, 2)) + 2)).padStart(2, '0')}${e.startTime.slice(2)}`
    dates = `${ymd}T${hm(e.startTime)}/${ymd}T${hm(end)}`
  } else {
    const next = new Date(`${e.date}T00:00:00`)
    next.setDate(next.getDate() + 1)
    dates = `${ymd}/${next.toISOString().slice(0, 10).replaceAll('-', '')}`
  }
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${e.name} — ${title}`,
    dates,
    ctz: 'Asia/Kolkata',
    location: [e.venueName, e.address].filter(Boolean).join(', '),
    details: e.description ?? '',
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

function EventActions({ e, className, tone = 'primary' }: { e: InvitationEvent; className?: string; tone?: 'primary' | 'plain' }) {
  const { names, track } = useInvitation()
  const dir = directionsUrl(e.mapsUrl, [e.venueName, e.address].filter(Boolean).join(', '))
  const cal = calendarUrl(e, `${names.bride} & ${names.groom}`)
  const cls = tone === 'primary' ? 'border-inv-primary/60 text-inv-primary hover:bg-inv-primary hover:text-inv-on-primary' : 'border-current/30 hover:border-current'
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {dir && (
        <a href={dir} target="_blank" rel="noopener noreferrer" onClick={() => track('open_map')} className={cn('inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition', cls)}>
          <Navigation className="size-4" aria-hidden /> Directions
        </a>
      )}
      {cal && (
        <a href={cal} target="_blank" rel="noopener noreferrer" className={cn('inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition', cls)}>
          <CalendarPlus className="size-4" aria-hidden /> Add to calendar
        </a>
      )}
    </div>
  )
}

function Meta({ e, className }: { e: InvitationEvent; className?: string }) {
  return (
    <ul className={cn('space-y-1.5 text-[0.95rem] text-inv-muted', className)}>
      {(e.startTime || e.endTime) && (
        <li className="flex items-center gap-2">
          <Clock className="size-4 shrink-0" aria-hidden /> {formatTimeRange(e.startTime, e.endTime)}
        </li>
      )}
      {(e.venueName || e.address) && (
        <li className="flex items-start gap-2">
          <MapPin className="mt-1 size-4 shrink-0" aria-hidden />
          <span>
            {e.venueName}
            {e.address && <span className="block text-sm opacity-80">{e.address}</span>}
          </span>
        </li>
      )}
      {e.dressCode && (
        <li className="flex items-center gap-2">
          <Shirt className="size-4 shrink-0" aria-hidden /> {e.dressCode}
        </li>
      )}
    </ul>
  )
}

export function EventsSection({ id, config }: SectionProps) {
  const { data, t, config: tpl } = useInvitation()
  const events = data.events
  if (events.length === 0) return null
  const kit = MOTIFS[tpl.theme.motif]
  const variant = config.variant ?? 'pillar-timeline'

  return (
    <SectionShell id={id} config={config} label="Events">
      {variant === 'call-sheet' ? (
        <p className="mb-10 text-center text-xs tracking-[0.5em] text-inv-primary uppercase">{t(config.title)}</p>
      ) : (
        <SectionTitle eyebrow={config.eyebrow} title={config.title} subtitle={config.subtitle} align={variant === 'table' ? 'left' : 'center'} />
      )}

      {variant === 'pillar-timeline' && (
        <ol className="relative mx-auto max-w-3xl">
          <span className="absolute top-0 bottom-0 left-[27px] w-[3px] border-x border-inv-primary/50" aria-hidden />
          {events.map((e) => {
            const Icon = iconFor(e)
            return (
              <Reveal as="li" key={e.id} className="relative mb-10 pl-20 last:mb-0">
                <span className="absolute top-0 left-0 grid size-14 place-items-center rounded-full border border-inv-primary bg-inv-bg text-inv-primary" style={clipStyle('temple')}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="text-sm tracking-[0.2em] text-inv-primary uppercase">{formatDate(e.date, 'EEE, d MMM yyyy')}</p>
                <h3 className="inv-display inv-display-cased mt-1 text-2xl sm:text-3xl">{e.name}</h3>
                {e.description && <p className="mt-2 leading-relaxed">{e.description}</p>}
                <Meta e={e} className="mt-3" />
                <EventActions e={e} className="mt-4" />
              </Reveal>
            )
          })}
        </ol>
      )}

      {variant === 'arch-cards' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e, i) => {
            const Icon = iconFor(e)
            return (
              <Reveal key={e.id} delay={i * 0.06} className="relative">
                <div className="absolute inset-0 bg-inv-primary/50" style={clipStyle('mihrab')} />
                <div className="relative m-[1.5px] flex h-[calc(100%-3px)] flex-col items-center bg-inv-bg px-6 pt-20 pb-8 text-center" style={clipStyle('mihrab')}>
                  <Icon className="size-7 text-inv-primary" aria-hidden />
                  <h3 className="inv-display mt-4 text-3xl">{e.name}</h3>
                  <p className="mt-2 text-sm tracking-[0.2em] text-inv-primary uppercase">{formatDate(e.date, 'EEEE, d MMMM')}</p>
                  {e.description && <p className="mt-3 text-sm leading-relaxed">{e.description}</p>}
                  <Meta e={e} className="mt-4 text-left" />
                  <EventActions e={e} className="mt-5 justify-center" />
                </div>
              </Reveal>
            )
          })}
        </div>
      )}

      {variant === 'programme' && (
        <div className="mx-auto max-w-3xl divide-y divide-inv-border">
          {events.map((e) => (
            <Reveal key={e.id} className="grid gap-4 py-8 sm:grid-cols-[150px_1fr]">
              <div>
                <p className="inv-display text-4xl leading-none">{formatDate(e.date, 'd')}</p>
                <p className="text-sm tracking-[0.2em] text-inv-muted uppercase">{formatDate(e.date, 'MMM yyyy')}</p>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  {kit.Glyph({})}
                  <h3 className="inv-display text-3xl">{e.name}</h3>
                </div>
                {e.description && <p className="mt-2 text-inv-muted italic">{e.description}</p>}
                <Meta e={e} className="mt-3" />
                <EventActions e={e} className="mt-4" />
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {variant === 'table' && (
        <div className="border-t border-inv-text/25">
          {events.map((e) => (
            <Reveal key={e.id} className="grid gap-3 border-b border-inv-text/15 py-7 sm:grid-cols-[180px_1.2fr_1fr_auto] sm:items-baseline sm:gap-8">
              <p className="text-sm tracking-[0.2em] text-inv-muted uppercase">{formatDate(e.date, 'EEE d MMM')}</p>
              <div>
                <h3 className="inv-display text-3xl uppercase">{e.name}</h3>
                {e.description && <p className="mt-1 text-sm text-inv-muted">{e.description}</p>}
              </div>
              <Meta e={e} />
              <EventActions e={e} tone="plain" />
            </Reveal>
          ))}
        </div>
      )}

      {variant === 'tickets' && (
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {events.map((e, i) => {
            const Icon = iconFor(e)
            const color = KIND_COLOR[e.kind] ?? 'var(--inv-primary)'
            return (
              <Reveal key={e.id} delay={i * 0.06} className="flex overflow-hidden rounded-[20px] bg-inv-bg shadow-[0_20px_40px_-24px_rgb(59_10_69/0.5)]">
                <div className="relative flex w-24 shrink-0 flex-col items-center justify-center gap-2 text-white" style={{ background: color }}>
                  <Icon className="size-7" aria-hidden />
                  <span className="inv-display text-3xl leading-none">{formatDate(e.date, 'd')}</span>
                  <span className="text-xs tracking-[0.2em] uppercase">{formatDate(e.date, 'MMM')}</span>
                  <span className="absolute top-0 -right-2 bottom-0 w-4" style={{ background: 'radial-gradient(circle at 8px 10px, var(--inv-bg) 5px, transparent 5.5px) 0 0 / 16px 20px' }} aria-hidden />
                </div>
                <div className="flex-1 p-5 pl-7">
                  <h3 className="inv-display text-2xl" style={{ color }}>
                    {e.name}
                  </h3>
                  {e.description && <p className="mt-1 text-sm">{e.description}</p>}
                  <Meta e={e} className="mt-3 text-sm" />
                  <EventActions e={e} className="mt-4" />
                </div>
              </Reveal>
            )
          })}
        </div>
      )}

      {variant === 'call-sheet' && (
        <div className="mx-auto max-w-4xl border border-inv-text/20">
          {events.map((e, i) => (
            <Reveal key={e.id} className="grid gap-4 border-b border-inv-text/20 p-6 last:border-b-0 sm:grid-cols-[110px_1fr_auto] sm:items-center">
              <div>
                <p className="text-[0.65rem] tracking-[0.4em] text-inv-muted">DAY {String(i + 1).padStart(2, '0')}</p>
                <p className="inv-display text-3xl text-inv-primary">{formatDate(e.date, 'dd.MM')}</p>
              </div>
              <div>
                <h3 className="inv-display text-3xl tracking-wide uppercase">{e.name}</h3>
                <p className="mt-1 text-sm text-inv-muted">
                  Call time {formatTimeRange(e.startTime, e.endTime)} · {e.venueName}
                </p>
                {e.dressCode && <p className="mt-1 text-sm text-inv-muted">Wardrobe: {e.dressCode}</p>}
                {e.description && <p className="mt-2 text-sm italic">{e.description}</p>}
              </div>
              <EventActions e={e} tone="plain" />
            </Reveal>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

// ---------------------------------------------------------------------------
function useInView<T extends Element>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting) setSeen(true)
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, inView, seen }
}

export function CountdownSection({ id, config }: SectionProps) {
  const { data, t, config: tpl } = useInvitation()
  const target = combineDateTime(data.date, data.time)
  const { ref, inView } = useInView<HTMLDivElement>()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!inView) return
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [inView])
  if (!target) return null
  const c = countdownTo(target, now)
  const units: [number, string][] = [
    [c.days, 'Days'],
    [c.hours, 'Hours'],
    [c.minutes, 'Minutes'],
    [c.seconds, 'Seconds'],
  ]
  const kit = MOTIFS[tpl.theme.motif]
  const variant = config.variant ?? 'framed'
  return (
    <SectionShell id={id} config={config} label="Countdown" className="text-center">
      <div ref={ref}>
        <SectionTitle eyebrow={config.eyebrow} title={c.past ? 'Just married' : config.title} />
        {c.past ? (
          <p className="text-lg text-inv-muted">Thank you for celebrating with us.</p>
        ) : variant === 'numerals' ? (
          <div className="flex flex-wrap items-baseline justify-center gap-x-8 gap-y-4" aria-live="off">
            {units.map(([v, l]) => (
              <div key={l}>
                <span className="inv-display block text-[clamp(3rem,11vw,7rem)] leading-none tabular-nums">{String(v).padStart(2, '0')}</span>
                <span className="text-xs tracking-[0.35em] text-inv-muted uppercase">{l}</span>
              </div>
            ))}
          </div>
        ) : variant === 'flip' ? (
          <div className="flex justify-center gap-2 sm:gap-4">
            {units.map(([v, l]) => (
              <div key={l} className="w-[22%] max-w-32">
                <div className="relative overflow-hidden rounded-md bg-black py-4 sm:py-6">
                  <span className="inv-display block text-[clamp(2.4rem,9vw,5rem)] leading-none text-inv-text tabular-nums">{String(v).padStart(2, '0')}</span>
                  <span className="absolute inset-x-0 top-1/2 h-px bg-inv-bg/80" aria-hidden />
                </div>
                <span className="mt-2 block text-[0.65rem] tracking-[0.35em] text-inv-muted uppercase">{l}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center gap-3 sm:gap-6">
            {units.map(([v, l]) => (
              <div key={l} className="relative w-[22%] max-w-36 border border-inv-primary/60 px-2 py-5 sm:py-8">
                <span className="pointer-events-none absolute inset-1 border border-inv-primary/25" aria-hidden />
                <span className="inv-display block text-[clamp(2rem,7vw,3.6rem)] leading-none text-inv-primary tabular-nums">{v}</span>
                <span className="mt-2 block text-[0.65rem] tracking-[0.3em] text-inv-muted uppercase sm:text-xs">{l}</span>
              </div>
            ))}
          </div>
        )}
        {!c.past && (
          <p className="mt-8 text-inv-muted">
            {formatDate(data.date)}
            {data.time && ` · ${formatTimeRange(data.time)}`}
          </p>
        )}
        {kit.Divider({ className: 'mt-8' })}
        <span className="sr-only">{t(config.title)}</span>
      </div>
    </SectionShell>
  )
}

// ---------------------------------------------------------------------------
export function VenueSection({ id, config }: SectionProps) {
  const { data, t, track, config: tpl } = useInvitation()
  if (!data.venueName && !data.venueAddress) return null
  const dir = directionsUrl(data.mapsUrl, [data.venueName, data.venueAddress].filter(Boolean).join(', '))
  const kit = MOTIFS[tpl.theme.motif]
  const venuePhoto = data.photos.find((p) => p.caption?.toLowerCase().includes('mandap') || p.caption?.toLowerCase().includes('venue'))
  const variant = config.variant ?? 'framed'
  const button = dir && (
    <a href={dir} target="_blank" rel="noopener noreferrer" onClick={() => track('open_map')} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-inv-primary px-7 text-inv-on-primary shadow-[0_12px_30px_-14px_var(--inv-primary)] transition hover:brightness-110">
      <Navigation className="size-4" aria-hidden /> Get directions
    </a>
  )

  if (variant === 'location-card') {
    return (
      <SectionShell id={id} config={config} label="Venue">
        <div className="mx-auto grid max-w-5xl overflow-hidden border border-inv-text/15 md:grid-cols-2">
          <div className="aspect-[4/3] bg-inv-surface md:aspect-auto">
            {(venuePhoto ?? data.photos[1]) && <img src={(venuePhoto ?? data.photos[1]).url} alt="" loading="lazy" className="size-full object-cover" />}
          </div>
          <div className="p-8 sm:p-12">
            <p className="text-[0.65rem] tracking-[0.5em] text-inv-primary uppercase">{t(config.title)}</p>
            <h2 className="inv-display mt-4 text-4xl uppercase">{data.venueName}</h2>
            <p className="mt-3 text-inv-muted">{data.venueAddress}</p>
            <p className="mt-6 text-sm tracking-[0.25em] uppercase">{formatDate(data.date, 'EEEE, d MMMM yyyy')}</p>
            {button}
          </div>
        </div>
      </SectionShell>
    )
  }

  return (
    <SectionShell id={id} config={config} label="Venue" className="text-center">
      <SectionTitle eyebrow={config.eyebrow} title={config.title} />
      <div className={cn('mx-auto max-w-2xl', variant === 'framed' && 'border border-inv-primary/50 px-6 py-12 sm:px-12')}>
        {kit.Glyph({ className: 'mx-auto mb-4' })}
        <h3 className="inv-display inv-display-cased text-[clamp(1.8rem,4.5vw,2.8rem)] leading-tight">{data.venueName}</h3>
        {data.venueAddress && <p className="mx-auto mt-3 max-w-md text-inv-muted">{data.venueAddress}</p>}
        <p className="mt-5 tracking-[0.15em] text-inv-primary">
          {formatDate(data.date)}
          {data.time && ` · ${formatTimeRange(data.time)}`}
        </p>
        {button}
      </div>
    </SectionShell>
  )
}

export function MapSection({ id, config }: SectionProps) {
  const { data } = useInvitation()
  const { ref, seen: load } = useInView<HTMLDivElement>()
  const q = [data.venueName, data.venueAddress ?? data.city].filter(Boolean).join(', ')
  if (!q) return null
  return (
    <section id={`s-${id}`} aria-label="Map" className={cn('px-5 pb-20 sm:px-8', config.background === 'surface' && 'bg-inv-surface')}>
      <div ref={ref} className="mx-auto aspect-[4/3] max-w-5xl overflow-hidden border border-inv-primary/40 bg-inv-surface sm:aspect-[16/7]">
        {load && (
          <iframe
            title={`Map of ${data.venueName ?? 'the venue'}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="size-full border-0 grayscale-[30%]"
          />
        )}
      </div>
    </section>
  )
}
