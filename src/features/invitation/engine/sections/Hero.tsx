import { ChevronDown } from 'lucide-react'
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { cn } from '@/lib/cn'
import { formatDate, formatTime } from '@/lib/format'
import type { SectionConfig } from '@/lib/validation/template'
import { useInvitation } from '../context'
import { MOTIFS } from '../motifs'
import { clipStyle, FrameOutline, Lantern, Star8 } from '../motifs/shapes'
import { Petals } from '../openings/Openings'

export interface SectionProps {
  id: string
  config: SectionConfig
}

const ease = [0.22, 1, 0.36, 1] as const

function useHero() {
  const ctx = useInvitation()
  const { data, config } = ctx
  const kit = MOTIFS[config.theme.motif]
  const cover = data.coverUrl ?? data.photos.find((p) => p.kind === 'couple')?.url ?? data.photos[0]?.url
  return { ...ctx, kit, cover, date: formatDate(data.date), ambient: config.animation.ambient }
}

function Stagger({ children, i = 0, className }: { children: React.ReactNode; i?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <m.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease }}
    >
      {children}
    </m.div>
  )
}

function ScrollCue() {
  return (
    <a href="#s-after-hero" className="absolute bottom-6 left-1/2 -translate-x-1/2 text-inv-muted" aria-label="Scroll to invitation">
      <ChevronDown className="size-6 animate-bounce" />
    </a>
  )
}

// ---------------------------------------------------------------------------
function TempleArch({ config }: SectionProps) {
  const { names, sacred, kit, cover, date, data, ambient, t } = useHero()
  return (
    <div className="tex-silk relative min-h-[100svh] overflow-hidden pt-14 pb-20">
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ background: kit.pattern }} />
      {kit.Header?.({ className: 'absolute inset-x-0 top-0 z-10' })}
      {ambient && kit.petals && <Petals colors={kit.petals} count={9} />}
      {kit.Corner({ className: 'absolute bottom-0 left-0 w-20 rotate-[-90deg] sm:w-28' })}
      {kit.Corner({ className: 'absolute right-0 bottom-0 w-20 rotate-90 sm:w-28', flip: true })}
      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 pt-10 text-center">
        <Stagger>
          <p className="inv-accent-font text-xl text-inv-accent sm:text-2xl">{sacred(config.eyebrow)}</p>
        </Stagger>
        <Stagger i={1} className="relative mt-8 h-[46vh] max-h-[460px] min-h-[300px] w-[min(72vw,330px)]">
          {kit.Backdrop?.({ className: 'absolute -inset-24 -z-10 opacity-30', spin: ambient })}
          <div className="absolute inset-0 overflow-hidden bg-inv-surface" style={clipStyle('temple')}>
            {cover && <img src={cover} alt={`${names.bride} and ${names.groom}`} className="size-full object-cover" fetchPriority="high" />}
          </div>
          <FrameOutline shape="temple" />
        </Stagger>
        <Stagger i={2}>
          <h1 className="inv-display inv-display-cased mt-10 text-[clamp(2.2rem,7vw,4.6rem)] leading-[1.05]">
            <span className="shimmer-text">{names.bride}</span>
            <span className="inv-script mx-3 text-[0.6em] text-inv-muted">&</span>
            <span className="shimmer-text">{names.groom}</span>
          </h1>
          {names.brideLocal && (
            <p className="inv-accent-font mt-3 text-xl text-inv-muted">
              {names.brideLocal} &nbsp;❦&nbsp; {names.groomLocal}
            </p>
          )}
        </Stagger>
        <Stagger i={3}>
          <p className="mt-4 italic text-inv-muted">{t(config.subtitle)}</p>
          {kit.Divider({ className: 'my-5' })}
          <p className="inv-display-cased tracking-[0.25em] text-inv-primary">{date}</p>
          <p className="mt-1 text-inv-muted">
            {formatTime(data.time) && `${formatTime(data.time)} · `}
            {data.city}
          </p>
        </Stagger>
      </div>
      <ScrollCue />
    </div>
  )
}

// ---------------------------------------------------------------------------
function MihrabFrame({ config }: SectionProps) {
  const { names, t, sacred, kit, cover, date, data } = useHero()
  const bismillah = sacred('بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ')
  return (
    <div className="tex-silk relative min-h-[100svh] overflow-hidden pt-24 pb-20">
      <div className="pointer-events-none absolute inset-0 opacity-[0.1]" style={{ background: kit.pattern }} />
      <div className="absolute inset-x-0 top-0 flex justify-between px-[4%]" aria-hidden>
        <Lantern className="h-32 w-11" />
        <Lantern className="hidden h-24 w-9 sm:block" />
        <Lantern className="hidden h-24 w-9 sm:block" />
        <Lantern className="h-32 w-11" />
      </div>
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
        <Stagger i={1} className="relative mx-auto h-[52vh] max-h-[520px] min-h-[320px] w-[min(78vw,360px)] lg:order-2">
          <div className="absolute -inset-4 bg-inv-primary/50" style={clipStyle('mihrab')} />
          <div className="absolute -inset-2 bg-inv-bg" style={clipStyle('mihrab')} />
          <div className="absolute inset-0 overflow-hidden" style={clipStyle('mihrab')}>
            {cover && <img src={cover} alt={`${names.bride} and ${names.groom}`} className="size-full object-cover" fetchPriority="high" />}
          </div>
        </Stagger>
        <div className="text-center lg:text-left">
          <Stagger>
            {bismillah && (
              <p className="inv-accent-font text-3xl leading-relaxed text-inv-accent" dir="rtl" lang="ar">
                {bismillah}
              </p>
            )}
            <p className="mt-2 text-sm text-inv-muted">{bismillah ? t(config.eyebrow) : ''}</p>
          </Stagger>
          <Stagger i={2}>
            <h1 className="inv-display mt-8 text-[clamp(2.6rem,7vw,5rem)] leading-[1.02]">
              {names.bride}
              <span className="my-2 flex items-center justify-center gap-3 text-[0.4em] text-inv-primary lg:justify-start">
                <Star8 size={18} /> &amp; <Star8 size={18} />
              </span>
              {names.groom}
            </h1>
            {names.brideLocal && (
              <p className="inv-accent-font mt-4 text-2xl text-inv-muted" dir="rtl">
                {names.brideLocal} و {names.groomLocal}
              </p>
            )}
          </Stagger>
          <Stagger i={3}>
            <p className="mt-5 italic text-inv-muted">{t(config.subtitle)}</p>
            <p className="mt-6 inline-block border-y border-inv-primary/50 py-2 tracking-[0.2em] text-inv-primary">
              {date} · {data.city}
            </p>
          </Stagger>
        </div>
      </div>
      <ScrollCue />
    </div>
  )
}

// ---------------------------------------------------------------------------
function Wreath({ config }: SectionProps) {
  const { names, t, kit, cover, date, data, ambient } = useHero()
  return (
    <div className="tex-paper relative min-h-[100svh] overflow-hidden pt-16 pb-24">
      {ambient && kit.petals && <Petals colors={kit.petals} count={8} />}
      {kit.Corner({ className: 'absolute top-0 left-0 w-36 sm:w-56' })}
      {kit.Corner({ className: 'absolute top-0 right-0 w-36 sm:w-56', flip: true })}
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 text-center">
        <Stagger>
          <p className="text-xs tracking-[0.35em] text-inv-muted">{t(config.eyebrow)}</p>
        </Stagger>
        <Stagger i={1} className="relative mt-6 grid aspect-square w-[min(86vw,440px)] place-items-center">
          {kit.Backdrop?.({ className: 'absolute inset-0 size-full' })}
          <h1 className="inv-script relative px-[16%] text-[clamp(2.1rem,8.4vw,4.2rem)] leading-[1.05]">
            {names.bride}
            <span className="block text-[0.55em] text-inv-primary">and</span>
            {names.groom}
          </h1>
        </Stagger>
        <Stagger i={2}>
          <p className="mt-2 text-inv-muted italic">{t(config.subtitle)}</p>
          <p className="mt-4 text-lg tracking-[0.15em]">{date}</p>
          <p className="text-inv-muted">
            {data.venueName}, {data.city}
          </p>
        </Stagger>
        {cover && (
          <Stagger i={3} className="relative mt-12 aspect-[4/5] w-[min(80vw,360px)] overflow-hidden rounded-t-full shadow-[0_30px_60px_-30px_rgb(74_59_47/0.5)]">
            <img src={cover} alt={`${names.bride} and ${names.groom}`} className="size-full object-cover" fetchPriority="high" />
          </Stagger>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function EditorialSplitHero({ config }: SectionProps) {
  const { names, t, cover, data } = useHero()
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '12%'])
  const dot = formatDate(data.date, 'dd.MM.yyyy')
  return (
    <div ref={ref} className="relative grid min-h-[100svh] lg:grid-cols-2">
      <div className="relative order-2 flex flex-col justify-between px-6 py-12 sm:px-12 lg:order-1 lg:py-16">
        <Stagger>
          <p className="text-xs tracking-[0.4em] text-inv-muted uppercase">{t(config.eyebrow)}</p>
        </Stagger>
        <Stagger i={1} className="my-10">
          <h1 className="inv-display text-[clamp(3.2rem,9vw,8rem)] leading-[0.86] uppercase">
            {names.bride}
            <span className="block pl-[12%] text-inv-accent">&amp;</span>
            <span className="block pl-[6%]">{names.groom}</span>
          </h1>
        </Stagger>
        <Stagger i={2} className="flex items-end justify-between gap-6 border-t border-inv-text/20 pt-5 text-sm">
          <span className="inv-display text-3xl tracking-[0.08em]">{dot}</span>
          <span className="text-right tracking-[0.25em] text-inv-muted uppercase">{t(config.subtitle)}</span>
        </Stagger>
      </div>
      <div className="relative order-1 h-[62svh] overflow-hidden lg:order-2 lg:h-auto">
        {cover && <m.img style={{ y }} src={cover} alt={`${names.bride} and ${names.groom}`} className="absolute inset-0 size-full scale-110 object-cover" fetchPriority="high" />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function GarlandBanner({ config }: SectionProps) {
  const { names, t, sacred, kit, cover, date, data, ambient } = useHero()
  return (
    <div className="tex-paper relative min-h-[100svh] overflow-hidden pt-20 pb-20">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ background: kit.pattern }} />
      {kit.Header?.({ className: 'absolute inset-x-0 top-0 z-10' })}
      {ambient && kit.petals && <Petals colors={kit.petals} count={12} />}
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 text-center">
        <Stagger>
          <p className="inv-accent-font text-xl text-inv-primary">{sacred(config.eyebrow)}</p>
          <p className="inv-accent-font mt-1 text-3xl text-inv-accent">{t(config.subtitle)}</p>
        </Stagger>
        <Stagger i={1} className="relative my-10 grid size-[min(76vw,340px)] place-items-center">
          {kit.Backdrop?.({ className: 'absolute -inset-16 opacity-50', spin: ambient })}
          <div className="absolute inset-0 rounded-full p-2" style={{ background: 'conic-gradient(from 0deg, #F29F05, #E0450B, #F7B32B, #C81D63, #F29F05)' }}>
            <div className="size-full overflow-hidden rounded-full border-4 border-inv-bg">
              {cover && <img src={cover} alt={`${names.bride} and ${names.groom}`} className="size-full object-cover" fetchPriority="high" />}
            </div>
          </div>
        </Stagger>
        <Stagger i={2}>
          <h1 className="inv-display text-[clamp(2.4rem,8vw,4.8rem)] leading-[1.05] text-inv-primary">
            {names.bride} <span className="text-inv-accent">&amp;</span> {names.groom}
          </h1>
          {names.brideLocal && (
            <p className="inv-accent-font mt-2 text-2xl text-inv-muted">
              {names.brideLocal} ❀ {names.groomLocal}
            </p>
          )}
          {kit.Divider({ className: 'my-6' })}
          <p className="text-lg font-medium">{date}</p>
          <p className="text-inv-muted">
            {data.venueName}, {data.city}
          </p>
        </Stagger>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function Letterbox({ config }: SectionProps) {
  const { names, t, cover, data } = useHero()
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.15])
  return (
    <div ref={ref} className="relative h-[100svh] overflow-hidden bg-black">
      {cover && <m.img style={{ scale }} src={cover} alt={`${names.bride} and ${names.groom}`} className="absolute inset-0 size-full object-cover" fetchPriority="high" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />
      <div className="absolute inset-x-0 top-0 h-[9vh] bg-black" />
      <div className="absolute inset-x-0 bottom-0 h-[9vh] bg-black" />
      <div className="absolute inset-x-0 bottom-[12vh] px-6 sm:px-12">
        <Stagger>
          <p className="text-sm italic text-inv-text/80">{t(config.eyebrow)}</p>
        </Stagger>
        <Stagger i={1}>
          <h1 className="inv-display mt-2 text-[clamp(3.4rem,13vw,10rem)] leading-[0.88] font-bold text-inv-text uppercase">
            {names.bride.split(' ')[0]}
            <span className="text-inv-primary"> &amp; </span>
            <br className="sm:hidden" />
            {names.groom.split(' ')[0]}
          </h1>
        </Stagger>
        <Stagger i={2} className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs tracking-[0.35em] text-inv-text/80 uppercase">
          <span>{formatDate(data.date, 'dd MMM yyyy')}</span>
          <span className="h-px w-8 bg-inv-primary" />
          <span>{t(config.subtitle)}</span>
        </Stagger>
      </div>
      <p className="absolute top-[3vh] right-6 text-[0.65rem] tracking-[0.4em] text-inv-text/50 sm:right-12">SC. 01 — TAKE 1</p>
    </div>
  )
}

const VARIANTS = {
  'temple-arch': TempleArch,
  'mihrab-frame': MihrabFrame,
  wreath: Wreath,
  'editorial-split': EditorialSplitHero,
  'garland-banner': GarlandBanner,
  'fullbleed-letterbox': Letterbox,
}

export function HeroSection(props: SectionProps) {
  const Variant = VARIANTS[(props.config.variant as keyof typeof VARIANTS) ?? 'wreath'] ?? Wreath
  return (
    <section id={`s-${props.id}`} className={cn('relative')} aria-label="Invitation cover">
      <Variant {...props} />
      <span id="s-after-hero" />
    </section>
  )
}
