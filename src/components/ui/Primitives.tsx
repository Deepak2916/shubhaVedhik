import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn('inline-flex items-center gap-2 text-mist', className)}>
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-blush', className)} aria-hidden />
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[22px] border border-dashed border-rose bg-white/50 px-6 py-14 text-center">
      {icon && <div className="mb-4 text-kumkum">{icon}</div>}
      <h3 className="font-display text-2xl">{title}</h3>
      {body && <p className="mt-2 max-w-md text-mist">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'gold'
const tones: Record<Tone, string> = {
  neutral: 'bg-blush text-plum',
  success: 'bg-leaf/10 text-leaf',
  warning: 'bg-haldi-soft/60 text-[#7a5300]',
  danger: 'bg-danger/10 text-danger',
  gold: 'bg-haldi text-plum',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium', tones[tone], className)}>{children}</span>
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-rose" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-kumkum transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-mist">{pct}%</span>
    </div>
  )
}

export function Panel({ children, className, title, description, actions }: { children: ReactNode; className?: string; title?: string; description?: string; actions?: ReactNode }) {
  return (
    <section className={cn('rounded-[22px] bg-white p-5 shadow-card ring-1 ring-rose/60 sm:p-7', className)}>
      {(title || actions) && (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-xl sm:text-2xl">{title}</h2>}
            {description && <p className="mt-1 text-sm text-mist">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { value: T; label: string; icon?: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="snap-row gap-1 rounded-full bg-blush/70 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn('inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition', value === t.value ? 'bg-white text-plum shadow-card' : 'text-mist hover:text-plum')}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 40 40" className="size-8" aria-hidden>
        <path d="M20 4c4.5 6 11 9.5 11 17.5A11 11 0 0 1 9 21.5C9 13.5 15.5 10 20 4z" fill="#E7A626" />
        <path d="M20 15c2.4 3.2 5.6 5 5.6 9a5.6 5.6 0 0 1-11.2 0c0-4 3.2-5.8 5.6-9z" fill="#9E1B3C" />
        <path d="M6 35h28" stroke={light ? '#fcf5f3' : '#2B1730'} strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className={cn('font-display text-[1.35rem] leading-none tracking-tight', light ? 'text-paper' : 'text-plum')}>ShubhaVedhik</span>
    </span>
  )
}
