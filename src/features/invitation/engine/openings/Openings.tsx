import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { formatDate, initials } from '@/lib/format'
import type { TemplateConfig } from '@/lib/validation/template'
import { useInvitation } from '../context'
import { MOTIFS } from '../motifs'
import { clipStyle, GarlandSwags, Marigold, Perforations, Star8 } from '../motifs/shapes'

export interface OpeningProps {
  onOpen: () => void
}

const ease = [0.22, 1, 0.36, 1] as const

/** Shared falling-petal layer (pure CSS animation). */
export function Petals({ colors, count = 12 }: { colors: string[]; count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const style = {
          left: `${(i * 97) % 100}%`,
          '--drift-dur': `${11 + ((i * 7) % 9)}s`,
          '--drift-delay': `${-((i * 3.3) % 14)}s`,
          '--drift-x': `${((i % 5) - 2) * 40}px`,
          '--drift-r': `${180 + i * 23}deg`,
        } as CSSProperties
        return (
          <span key={i} className="ambient-petal" style={style}>
            <svg width={10 + (i % 3) * 4} height={12 + (i % 3) * 5} viewBox="0 0 10 14">
              <path d="M5 0C9 4 9 10 5 14 1 10 1 4 5 0z" fill={colors[i % colors.length]} opacity=".85" />
            </svg>
          </span>
        )
      })}
    </div>
  )
}

function useOpeningText() {
  const { data, config, names, t: plain, sacred } = useInvitation()
  const date = config.opening.showDate ? formatDate(data.date, 'd MMMM yyyy') : ''
  // eyebrow may hold a religious invocation; everything else is plain text
  const t = (text?: string | null) => (text === config.opening.eyebrow ? sacred(text) : plain(text))
  return { o: config.opening, names, date, t, cover: data.coverUrl ?? data.photos[0]?.url ?? config.opening.backgroundImage }
}

function OpenButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return (
    <m.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 text-[0.95rem] tracking-wide focus-visible:outline-2 focus-visible:outline-offset-4',
        className ?? 'bg-inv-primary text-inv-on-primary shadow-[0_12px_30px_-12px_var(--inv-primary)]',
      )}
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-inv-primary/30 [animation-duration:2.6s]" aria-hidden />
      <span className="relative">{label}</span>
    </m.button>
  )
}

function Names({ className, amp = '&' }: { className?: string; amp?: string }) {
  const { names } = useOpeningText()
  return (
    <h1 className={cn('inv-display inv-display-cased leading-[1.05]', className)}>
      <span className="block">{names.bride}</span>
      <span className="inv-script block py-1 text-[0.55em] text-inv-primary">{amp}</span>
      <span className="block">{names.groom}</span>
    </h1>
  )
}

// ---------------------------------------------------------------------------
function TempleDoors({ onOpen }: OpeningProps) {
  const { o, names, date, t, cover } = useOpeningText()
  const [opening, setOpening] = useState(false)
  const reduce = useReducedMotion()
  const go = () => {
    setOpening(true)
    setTimeout(onOpen, reduce ? 0 : 1500)
  }
  const door = (side: 'l' | 'r') => (
    <m.div
      className="tex-silk relative h-full w-1/2 bg-inv-bg"
      style={{ transformOrigin: side === 'l' ? 'left center' : 'right center', backfaceVisibility: 'hidden' }}
      animate={opening ? { rotateY: side === 'l' ? -105 : 105 } : { rotateY: 0 }}
      transition={{ duration: 1.5, ease: [0.65, 0, 0.35, 1] }}
    >
      <div className="absolute inset-3 border border-inv-primary/60 sm:inset-5" />
      <div className="absolute inset-6 grid grid-cols-3 gap-3 opacity-80 sm:inset-10 sm:gap-6" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="grid place-items-center rounded-t-full border border-inv-primary/40">
            <span className="size-2 rounded-full bg-inv-primary shadow-[0_0_8px_var(--inv-accent)]" />
          </div>
        ))}
      </div>
      <div className={cn('absolute top-1/2 size-8 -translate-y-1/2 rounded-full border-2 border-inv-primary', side === 'l' ? 'right-4' : 'left-4')} aria-hidden />
    </m.div>
  )
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-inv-bg" style={{ perspective: 1600 }}>
      {cover && <img src={cover} alt="" className="absolute inset-0 size-full object-cover opacity-40 blur-sm" />}
      <div className="absolute inset-0 flex">
        {door('l')}
        {door('r')}
      </div>
      <AnimatePresence>
        {!opening && (
          <m.div exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <div className="rounded-[2rem] bg-inv-bg/80 px-6 py-10 backdrop-blur-sm sm:px-14">
              <p className="inv-accent-font text-lg text-inv-accent">{t(o.eyebrow)}</p>
              {MOTIFS.temple.Divider({ className: 'my-5' })}
              <p className="inv-display-cased text-xs tracking-[0.35em] text-inv-muted">{t(o.title)}</p>
              <Names className="mt-5 text-[clamp(2.2rem,9vw,4.2rem)] text-inv-text" />
              {names.brideLocal && (
                <p className="inv-accent-font mt-3 text-lg text-inv-muted">
                  {names.brideLocal} ❦ {names.groomLocal}
                </p>
              )}
              {date && <p className="mt-4 tracking-[0.2em] text-inv-primary">{date}</p>}
              <div className="mt-8">
                <OpenButton label={o.buttonLabel} onClick={go} />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
function Mihrab({ onOpen }: OpeningProps) {
  const { o, date, t, cover } = useOpeningText()
  const [opening, setOpening] = useState(false)
  const reduce = useReducedMotion()
  const go = () => {
    setOpening(true)
    setTimeout(onOpen, reduce ? 0 : 1300)
  }
  return (
    <m.div className="fixed inset-0 z-50 overflow-hidden bg-inv-bg" animate={opening ? { opacity: 0 } : { opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }}>
      <div className="absolute inset-0 opacity-[0.14]" style={{ background: MOTIFS.geometric.pattern }} aria-hidden />
      {MOTIFS.geometric.Header?.({ className: 'absolute inset-x-0 top-0' })}
      <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="inv-accent-font text-2xl text-inv-accent sm:text-3xl" dir="rtl">{t(o.eyebrow)}</p>
        <m.div
          className="relative mt-6 h-[38vh] max-h-[360px] w-[min(62vw,260px)]"
          animate={opening ? { scale: 6 } : { scale: 1 }}
          transition={{ duration: 1.3, ease: [0.7, 0, 0.3, 1] }}
        >
          <div className="absolute -inset-3 bg-inv-primary/70" style={clipStyle('mihrab')} />
          <div className="absolute -inset-1.5 bg-inv-bg" style={clipStyle('mihrab')} />
          <div className="absolute inset-0 overflow-hidden bg-inv-surface" style={clipStyle('mihrab')}>
            {cover && <img src={cover} alt="" className="size-full object-cover" />}
          </div>
        </m.div>
        <m.div animate={opening ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="mt-7 text-sm tracking-[0.3em] text-inv-muted">{t(o.title)}</p>
          <Names className="mt-3 text-[clamp(2rem,8vw,3.6rem)] text-inv-text" />
          {date && (
            <p className="mt-3 flex items-center justify-center gap-3 text-inv-primary">
              <Star8 size={14} /> {date} <Star8 size={14} />
            </p>
          )}
          <div className="mt-7">
            <OpenButton label={o.buttonLabel} onClick={go} />
          </div>
        </m.div>
      </div>
    </m.div>
  )
}

// ---------------------------------------------------------------------------
export function EnvelopeScene({ onOpen, monogram, recipient, recipientClassName, children, compact }: { onOpen: () => void; monogram: string; recipient: string; recipientClassName?: string; children: ReactNode; compact?: boolean }) {
  const [stage, setStage] = useState<0 | 1 | 2>(0)
  const reduce = useReducedMotion()
  const go = () => {
    if (stage) return
    setStage(1)
    setTimeout(() => setStage(2), reduce ? 0 : 650)
    setTimeout(onOpen, reduce ? 0 : 2100)
  }
  return (
    <div className={cn('relative mx-auto aspect-[1.45] w-full', compact ? 'max-w-[340px]' : 'max-w-[460px]')} style={{ perspective: 1400 }}>
      {/* back of envelope */}
      <div className="absolute inset-0 rounded-md bg-[color-mix(in_oklab,var(--inv-surface)_85%,#000_6%)] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.45)]" />
      {/* the card that slides out */}
      <m.div
        className="absolute inset-x-[6%] top-[8%] bottom-[6%] rounded-sm bg-inv-bg px-4 py-5 text-center shadow-md ring-1 ring-inv-border/50"
        initial={false}
        animate={stage === 0 ? { opacity: 0, y: '6%' } : stage === 1 ? { opacity: 1, y: 0 } : { opacity: 1, y: '-62%' }}
        transition={{ duration: stage === 1 ? 0.3 : 1, ease }}
        style={{ zIndex: stage === 2 ? 3 : 1 }}
      >
        {children}
      </m.div>
      {/* front pocket */}
      <svg viewBox="0 0 145 100" preserveAspectRatio="none" className="absolute inset-0 z-[2] size-full" aria-hidden>
        <path d="M0 100V30l72.5 42L145 30v70z" fill="var(--inv-surface)" />
        <path d="M0 100l58-40M145 100L87 60" stroke="var(--inv-border)" strokeWidth=".4" />
      </svg>
      {/* flap */}
      <m.div
        className="absolute inset-x-0 top-0 z-[4] h-[58%]"
        style={{ transformOrigin: 'top center', zIndex: stage === 2 ? 0 : 4 }}
        animate={stage ? { rotateX: 178 } : { rotateX: 0 }}
        transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
      >
        <svg viewBox="0 0 145 58" preserveAspectRatio="none" className="size-full drop-shadow-[0_3px_3px_rgb(0_0_0/0.12)]" aria-hidden>
          <path d="M0 0h145L72.5 56z" fill="color-mix(in oklab, var(--inv-surface) 92%, #000 4%)" stroke="var(--inv-border)" strokeWidth=".4" />
        </svg>
      </m.div>
      {/* wax seal */}
      <AnimatePresence>
        {stage === 0 && (
          <m.button
            type="button"
            onClick={go}
            aria-label="Break the seal and open the invitation"
            className="absolute top-[50%] left-1/2 z-[5] grid size-[22%] max-h-24 max-w-24 min-w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
            exit={{ scale: 1.4, opacity: 0, rotate: 25 }}
            transition={{ duration: 0.45 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full drop-shadow-[0_6px_8px_rgb(0_0_0/0.3)]" aria-hidden>
              <path d="M50 3c8 0 10 6 17 8s13-2 18 4 1 12 4 18 9 9 8 17-7 10-8 17 4 12-1 18-12 4-18 7-9 9-17 9-10-6-17-8-13 2-18-4-1-12-4-18-9-9-8-17 7-10 8-17-4-12 1-18 12-4 18-7S42 3 50 3z" fill="var(--inv-primary)" />
              <circle cx="50" cy="50" r="31" fill="none" stroke="var(--inv-accent)" strokeWidth="1.5" opacity=".7" />
            </svg>
            <span className="inv-script relative text-[clamp(1.2rem,5vw,2rem)] text-inv-on-primary">{monogram}</span>
          </m.button>
        )}
      </AnimatePresence>
      {stage === 0 && <p className={cn('absolute inset-x-0 -bottom-10 text-center text-sm italic', recipientClassName ?? 'text-inv-muted')}>{recipient}</p>}
    </div>
  )
}

function Envelope({ onOpen }: OpeningProps) {
  const { o, names, date, t } = useOpeningText()
  const kit = MOTIFS.floral
  return (
    <div className="tex-paper fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-inv-bg px-6">
      <Petals colors={kit.petals ?? ['#E9D3C0']} count={10} />
      {kit.Corner({ className: 'absolute top-0 left-0 w-32 sm:w-48' })}
      {kit.Corner({ className: 'absolute top-0 right-0 w-32 sm:w-48', flip: true })}
      <p className="mb-3 text-sm tracking-[0.25em] text-inv-muted">{t(o.eyebrow)}</p>
      <h1 className="inv-script mb-10 text-center text-[clamp(2.4rem,10vw,4.4rem)] leading-none text-inv-text">
        {names.bride} <span className="text-inv-primary">&</span> {names.groom}
      </h1>
      <EnvelopeScene onOpen={onOpen} monogram={initials(names.bride, names.groom).split('').join('·')} recipient={`${t(o.buttonLabel)} to open`}>
        <p className="text-[0.65rem] tracking-[0.3em] text-inv-muted">{t(o.title)}</p>
        <p className="inv-script mt-2 text-3xl text-inv-text">
          {names.bride} & {names.groom}
        </p>
        {date && <p className="mt-2 text-xs text-inv-primary">{date}</p>}
      </EnvelopeScene>
    </div>
  )
}

// ---------------------------------------------------------------------------
function Curtain({ onOpen }: OpeningProps) {
  const { o, names, date, t } = useOpeningText()
  const [opening, setOpening] = useState(false)
  const reduce = useReducedMotion()
  const strings = 14
  const go = () => {
    setOpening(true)
    setTimeout(onOpen, reduce ? 0 : 1400)
  }
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-inv-bg">
      <m.div className="tex-paper absolute inset-0 bg-inv-surface" animate={opening ? { opacity: 0 } : { opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }} />
      {/* marigold strings */}
      <div className="absolute inset-0 flex justify-between overflow-hidden px-1" aria-hidden>
        {Array.from({ length: strings }, (_, i) => {
          const left = i < strings / 2
          return (
            <m.div
              key={i}
              className="flex h-full flex-col items-center gap-0.5"
              animate={opening ? { x: left ? '-60vw' : '60vw', opacity: 0 } : { x: 0, opacity: 1 }}
              transition={{ duration: 1.1, delay: Math.abs(i - strings / 2) * 0.03, ease: [0.65, 0, 0.35, 1] }}
            >
              <div className="anim-sway flex flex-col items-center" style={{ animationDelay: `${-i * 0.4}s` }}>
                {Array.from({ length: 48 }, (_, j) => (
                  <Marigold key={j} size={j % 5 === 4 ? 14 : 20} className={j % 5 === 4 ? 'opacity-90' : ''} />
                ))}
              </div>
            </m.div>
          )
        })}
      </div>
      <GarlandSwags className="absolute inset-x-0 top-0 h-14 w-full sm:h-20" />
      <AnimatePresence>
        {!opening && (
          <m.div exit={{ opacity: 0, scale: 0.96 }} className="absolute inset-0 flex items-center justify-center px-6">
            <div className="tex-paper rounded-[28px] bg-inv-bg px-7 py-10 text-center shadow-[0_30px_60px_-30px_rgb(59_10_69/0.6)] ring-4 ring-inv-accent/70 sm:px-14">
              <p className="inv-accent-font text-lg text-inv-primary">{t(o.eyebrow)}</p>
              {MOTIFS.festive.Divider({ className: 'my-4' })}
              <p className="inv-display text-2xl text-inv-accent">{t(o.title)}</p>
              <Names className="mt-3 text-[clamp(2.1rem,8.5vw,3.8rem)] text-inv-text" />
              {names.brideLocal && <p className="inv-accent-font mt-2 text-lg text-inv-muted">{names.brideLocal} weds {names.groomLocal}</p>}
              {date && <p className="mt-3 font-medium text-inv-primary">{date}</p>}
              <div className="mt-7">
                <OpenButton label={o.buttonLabel} onClick={go} />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
function FilmLeader({ onOpen }: OpeningProps) {
  const { o, names, date, t, cover } = useOpeningText()
  const [count, setCount] = useState<number | null>(null)
  const [opening, setOpening] = useState(false)
  const reduce = useReducedMotion()
  const go = () => {
    if (reduce) return onOpen()
    setCount(3)
    setTimeout(() => setCount(2), 650)
    setTimeout(() => setCount(1), 1300)
    setTimeout(() => {
      setCount(null)
      setOpening(true)
    }, 1950)
    setTimeout(onOpen, 2900)
  }
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black text-inv-text">
      {cover && <img src={cover} alt="" className="absolute inset-0 size-full object-cover opacity-30 grayscale" />}
      <Perforations vertical className="absolute top-0 bottom-0 left-2 w-2.5 sm:left-4" />
      <Perforations vertical className="absolute top-0 right-2 bottom-0 w-2.5 sm:right-4" />
      <m.div className="absolute inset-x-0 top-0 z-10 h-1/2 bg-black" animate={opening ? { y: '-88%' } : { y: 0 }} transition={{ duration: 0.9, ease }} />
      <m.div className="absolute inset-x-0 bottom-0 z-10 h-1/2 bg-black" animate={opening ? { y: '88%' } : { y: 0 }} transition={{ duration: 0.9, ease }} />
      <div className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          {count !== null ? (
            <m.div key={count} initial={{ opacity: 0, scale: 1.2 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="relative grid size-56 place-items-center rounded-full border-2 border-inv-text/70">
              <div className="absolute inset-4 rounded-full border border-inv-text/40" />
              <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(rgb(255 255 255 / 0.18) 0deg, transparent 0deg 360deg)' }} />
              <span className="inv-display text-8xl">{count}</span>
              <span className="absolute inset-x-0 top-1/2 h-px bg-inv-text/40" />
              <span className="absolute inset-y-0 left-1/2 w-px bg-inv-text/40" />
            </m.div>
          ) : !opening ? (
            <m.div key="title" exit={{ opacity: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs tracking-[0.5em] text-inv-primary">{t(o.title)}</p>
              <p className="mt-6 text-sm italic text-inv-muted">{t(o.eyebrow)}</p>
              <h1 className="inv-display inv-display-cased mt-4 text-[clamp(2.6rem,11vw,6rem)] leading-[0.95]">
                <span className="block">{names.bride}</span>
                <span className="block py-1 text-[0.5em] text-inv-primary">×</span>
                <span className="block">{names.groom}</span>
              </h1>
              {date && <p className="mt-5 tracking-[0.3em] text-inv-muted">{date}</p>}
              <button type="button" onClick={go} className="group mt-10 inline-flex items-center gap-3 rounded-full border border-inv-text/40 py-2 pr-6 pl-2 text-sm tracking-[0.3em] hover:border-inv-primary">
                <span className="grid size-10 place-items-center rounded-full bg-inv-primary text-inv-on-primary transition group-hover:scale-105">▶</span>
                {t(o.buttonLabel)}
              </button>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
function EditorialSplit({ onOpen }: OpeningProps) {
  const { o, names, date, t } = useOpeningText()
  const [opening, setOpening] = useState(false)
  const reduce = useReducedMotion()
  const go = () => {
    setOpening(true)
    setTimeout(onOpen, reduce ? 0 : 1100)
  }
  const half = (top: boolean) => (
    <m.div
      className={cn('absolute inset-x-0 flex overflow-hidden bg-inv-bg', top ? 'top-0 h-1/2 items-end' : 'bottom-0 h-1/2 items-start')}
      animate={opening ? { y: top ? '-100%' : '100%' } : { y: 0 }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="w-full px-6 sm:px-12">
        {top ? (
          <div className="pb-4">
            <p className="text-xs tracking-[0.4em] text-inv-muted">{t(o.eyebrow)}</p>
            <p className="inv-display mt-4 text-[clamp(3.4rem,16vw,11rem)] leading-[0.82] uppercase">{names.bride}</p>
          </div>
        ) : (
          <div className="flex flex-col items-end pt-4 text-right">
            <p className="inv-display text-[clamp(3.4rem,16vw,11rem)] leading-[0.82] uppercase">
              <span className="text-inv-accent">&amp;</span> {names.groom}
            </p>
            <div className="mt-6 flex w-full items-center justify-between gap-4">
              <button type="button" onClick={go} className="h-12 border-b border-inv-text text-sm tracking-[0.35em] hover:text-inv-accent">
                {t(o.buttonLabel)}
              </button>
              {date && <p className="text-xs tracking-[0.35em] text-inv-muted">{date}</p>}
            </div>
          </div>
        )}
      </div>
    </m.div>
  )
  return (
    <div className="fixed inset-0 z-50 text-inv-text">
      {half(true)}
      {half(false)}
      <m.span className="absolute inset-x-6 top-1/2 h-px bg-inv-text/30 sm:inset-x-12" animate={opening ? { scaleX: 0 } : { scaleX: 1 }} />
    </div>
  )
}

export const OPENINGS: Record<TemplateConfig['opening']['style'], (p: OpeningProps) => ReactNode> = {
  'temple-doors': TempleDoors,
  mihrab: Mihrab,
  envelope: Envelope,
  curtain: Curtain,
  'film-leader': FilmLeader,
  'editorial-split': EditorialSplit,
}

