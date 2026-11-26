import { m, useReducedMotion, type Variants } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { SectionConfig } from '@/lib/validation/template'
import { useInvitation } from './context'

const spacing = { compact: 'py-14 sm:py-16', normal: 'py-20 sm:py-28', airy: 'py-28 sm:py-40' }

export function useRevealVariants(override?: SectionConfig['reveal']): Variants {
  const { config } = useInvitation()
  const reduce = useReducedMotion()
  const kind = !override || override === 'inherit' ? config.animation.reveal : override
  const d = config.animation.duration
  const ease = [0.22, 1, 0.36, 1] as const
  if (reduce || kind === 'none') return { hidden: { opacity: 1 }, show: { opacity: 1 } }
  switch (kind) {
    case 'fade':
      return { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: d, ease } } }
    case 'zoom':
      return { hidden: { opacity: 0, scale: 0.94 }, show: { opacity: 1, scale: 1, transition: { duration: d, ease } } }
    case 'clip':
      return {
        hidden: { opacity: 0, clipPath: 'inset(12% 0% 12% 0%)' },
        show: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: d * 1.1, ease } },
      }
    default:
      return { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: d, ease } } }
  }
}

/** Reveal-on-scroll wrapper for a block inside a section. */
export function Reveal({ children, className, delay = 0, as = 'div' }: { children: ReactNode; className?: string; delay?: number; as?: 'div' | 'li' | 'article' }) {
  const variants = useRevealVariants()
  const Comp = m[as]
  return (
    <Comp
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay }}
    >
      {children}
    </Comp>
  )
}

interface SectionShellProps {
  id: string
  config: SectionConfig
  children: ReactNode
  className?: string
  /** Default background when the section config doesn't set one. */
  defaultBackground?: SectionConfig['background']
  bleed?: boolean
  style?: CSSProperties
  label?: string
}

export function SectionShell({ id, config, children, className, defaultBackground = 'base', bleed, style, label }: SectionShellProps) {
  const bg = config.background ?? defaultBackground
  const image = bg === 'image' && config.backgroundImage
  const variants = useRevealVariants(config.reveal)
  return (
    <section
      id={`s-${id}`}
      aria-label={label}
      className={cn(
        'relative isolate',
        !bleed && spacing[config.spacing ?? 'normal'],
        bg === 'surface' && 'bg-inv-surface',
        bg === 'primary' && 'bg-inv-primary text-inv-on-primary',
        className,
      )}
      style={style}
    >
      {image && (
        <>
          <img src={config.backgroundImage} alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-20 size-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-inv-bg" style={{ opacity: config.overlay ?? 0.7 }} />
        </>
      )}
      <m.div variants={variants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }} className={cn(!bleed && 'mx-auto w-full max-w-6xl px-5 sm:px-8', config.align === 'left' ? 'text-left' : '')}>
        {children}
      </m.div>
    </section>
  )
}

export function SectionTitle({ eyebrow, title, subtitle, align = 'center', className }: { eyebrow?: string; title?: string; subtitle?: string; align?: 'left' | 'center'; className?: string }) {
  const { t } = useInvitation()
  if (!title && !eyebrow) return null
  return (
    <header className={cn('mb-10 sm:mb-14', align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl', className)}>
      {eyebrow && <p className="inv-accent-font mb-3 text-[0.95rem] text-inv-primary">{t(eyebrow)}</p>}
      {title && <h2 className="inv-display inv-display-cased text-[clamp(1.9rem,5vw,3.2rem)] leading-[1.08] text-inv-text">{t(title)}</h2>}
      {subtitle && <p className="mt-3 text-inv-muted">{t(subtitle)}</p>}
    </header>
  )
}
