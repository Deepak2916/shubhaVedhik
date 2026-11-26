import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { ThemeConfig } from '@/lib/validation/template'
import { Blossom, Diya, GarlandSwags, Kalash, Lantern, Lotus, Mandala, Marigold, Perforations, Sprig, Star8, Thoranam } from './shapes'

export interface MotifKit {
  /** Ornamental divider between title and content. */
  Divider: (p: { className?: string }) => ReactNode
  /** Decoration placed in section corners. */
  Corner: (p: { className?: string; flip?: boolean }) => ReactNode
  /** Optional element hung across the top of hero/featured sections. */
  Header?: (p: { className?: string }) => ReactNode
  /** Large faint background figure for heroes. */
  Backdrop?: (p: { className?: string; spin?: boolean }) => ReactNode
  /** Small glyph used for list bullets / event markers. */
  Glyph: (p: { className?: string }) => ReactNode
  /** Falling particles colour set for the ambient layer (null = none). */
  petals: string[] | null
  /** Background pattern CSS (applied with low opacity). */
  pattern?: string
}

const rule = (className?: string) => <span className={cn('inv-rule block h-px w-16 sm:w-24', className)} />

const kolam = `radial-gradient(circle at 1px 1px, var(--inv-primary) 1px, transparent 1.6px) 0 0 / 22px 22px`
const girih = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%23D4AF63' stroke-width='.8'%3E%3Crect x='16' y='16' width='24' height='24'/%3E%3Crect x='16' y='16' width='24' height='24' transform='rotate(45 28 28)'/%3E%3Cpath d='M0 28h8M48 28h8M28 0v8M28 48v8'/%3E%3C/g%3E%3C/svg%3E") 0 0 / 56px 56px`
const bandhani = `radial-gradient(circle, var(--inv-primary) 1.4px, transparent 2px) 0 0 / 18px 18px, radial-gradient(circle, var(--inv-accent) 1.2px, transparent 1.8px) 9px 9px / 18px 18px`

export const MOTIFS: Record<ThemeConfig['motif'], MotifKit> = {
  temple: {
    Divider: ({ className }) => (
      <div className={cn('flex items-center justify-center gap-3', className)} aria-hidden>
        {rule()} <Lotus size={44} /> {rule()}
      </div>
    ),
    Corner: ({ className, flip }) => (
      <svg viewBox="0 0 80 80" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
        <g fill="none" stroke="var(--inv-primary)" strokeWidth="1.2">
          <path d="M4 76V20c0-9 7-16 16-16h56" />
          <path d="M12 76V26c0-8 6-14 14-14h50" opacity=".6" />
          <circle cx="20" cy="20" r="5" fill="var(--inv-accent)" fillOpacity=".5" />
          <path d="M28 4c4 6 4 10 0 14-4-4-4-8 0-14zM4 28c6 4 10 4 14 0-4-4-8-4-14 0z" fill="var(--inv-primary)" fillOpacity=".3" />
        </g>
      </svg>
    ),
    Header: ({ className }) => <Thoranam className={className} />,
    Backdrop: ({ className, spin }) => <Mandala className={className} spin={spin} />,
    Glyph: ({ className }) => <Diya size={28} className={className} />,
    petals: ['#E8C76A', '#F29F05', '#C9A24A'],
    pattern: kolam,
  },
  geometric: {
    Divider: ({ className }) => (
      <div className={cn('flex items-center justify-center gap-3', className)} aria-hidden>
        {rule()} <Star8 size={26} /> {rule()}
      </div>
    ),
    Corner: ({ className, flip }) => (
      <svg viewBox="0 0 80 80" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
        <g fill="none" stroke="var(--inv-primary)" strokeWidth="1">
          <path d="M2 78V2h76" />
          <path d="M10 78V10h68" opacity=".5" />
          <g transform="translate(26 26)">
            <rect x="-10" y="-10" width="20" height="20" />
            <rect x="-10" y="-10" width="20" height="20" transform="rotate(45)" />
          </g>
        </g>
      </svg>
    ),
    Header: ({ className }) => (
      <div className={cn('flex justify-between px-[6%]', className)} aria-hidden>
        <Lantern className="h-28 w-10" />
        <Lantern className="hidden h-20 w-8 sm:block" />
        <Lantern className="hidden h-20 w-8 sm:block" />
        <Lantern className="h-28 w-10" />
      </div>
    ),
    Glyph: ({ className }) => <Star8 size={22} className={className} />,
    petals: null,
    pattern: girih,
  },
  floral: {
    Divider: ({ className }) => (
      <div className={cn('flex items-center justify-center gap-1', className)} aria-hidden>
        <Sprig className="h-6 w-20" flip />
        <Blossom size={26} />
        <Sprig className="h-6 w-20" />
      </div>
    ),
    Corner: ({ className, flip }) => (
      <svg viewBox="0 0 120 120" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
        <g fill="none" stroke="var(--inv-accent)" strokeWidth="1.2" strokeLinecap="round">
          <path d="M6 114C10 70 40 30 112 6" />
          <path d="M30 70c-8-6-10-16-4-24 8 4 10 14 4 24zM52 44c-6-8-6-18 2-24 6 6 6 16-2 24zM78 24c-4-8-2-16 6-20 4 8 2 16-6 20z" fill="var(--inv-accent)" fillOpacity=".2" />
          <path d="M30 70c8 2 18-2 22-10-8-4-18 0-22 10zM52 44c8 2 16-4 18-12-8-2-16 2-18 12z" fill="var(--inv-accent)" fillOpacity=".15" />
        </g>
        <g transform="translate(18 92)">
          {[0, 72, 144, 216, 288].map((r) => (
            <path key={r} d="M0 0C-6-4-7-14 0-18 7-14 6-4 0 0z" fill="var(--inv-primary)" fillOpacity=".3" stroke="var(--inv-primary)" strokeWidth=".8" transform={`rotate(${r})`} />
          ))}
          <circle r="3.5" fill="var(--inv-accent)" />
        </g>
      </svg>
    ),
    Backdrop: ({ className }) => (
      <svg viewBox="-100 -100 200 200" className={className} aria-hidden>
        <g fill="none" stroke="var(--inv-accent)" strokeWidth=".8">
          {Array.from({ length: 28 }, (_, i) => (
            <path key={i} d="M0-86c5-4 12-4 16 1-5 4-12 4-16-1z" transform={`rotate(${i * (360 / 28)})`} fill="var(--inv-accent)" fillOpacity=".18" />
          ))}
          <circle r="80" opacity=".5" />
        </g>
        {[20, 110, 200, 290].map((r) => (
          <g key={r} transform={`rotate(${r}) translate(0 -82)`}>
            {[0, 72, 144, 216, 288].map((p) => (
              <path key={p} d="M0 0C-5-3-6-11 0-14 6-11 5-3 0 0z" fill="var(--inv-primary)" fillOpacity=".35" transform={`rotate(${p})`} />
            ))}
          </g>
        ))}
      </svg>
    ),
    Glyph: ({ className }) => <Blossom size={22} className={className} />,
    petals: ['#E9D3C0', '#D8B4A6', '#F3E7DA'],
  },
  editorial: {
    Divider: ({ className }) => <span className={cn('mx-auto block h-px w-24 bg-inv-text/40', className)} aria-hidden />,
    Corner: () => null,
    Glyph: ({ className }) => <span className={cn('inline-block size-1.5 rounded-full bg-inv-accent', className)} aria-hidden />,
    petals: null,
  },
  festive: {
    Divider: ({ className }) => (
      <div className={cn('flex items-center justify-center gap-2', className)} aria-hidden>
        <Marigold size={14} /> {rule('w-10 sm:w-16')} <Kalash size={34} /> {rule('w-10 sm:w-16')} <Marigold size={14} />
      </div>
    ),
    Corner: ({ className, flip }) => (
      <div className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
        <Mandala className="size-full opacity-60" />
      </div>
    ),
    Header: ({ className }) => <GarlandSwags className={cn('h-12 w-full sm:h-16', className)} />,
    Backdrop: ({ className, spin }) => <Mandala className={className} spin={spin} />,
    Glyph: ({ className }) => <Marigold size={20} className={className} />,
    petals: ['#F29F05', '#F7B32B', '#E0450B', '#C81D63'],
    pattern: bandhani,
  },
  film: {
    Divider: ({ className }) => (
      <div className={cn('flex items-center justify-center gap-4 text-[0.7rem] tracking-[0.3em] text-inv-muted', className)} aria-hidden>
        <span className="h-px w-12 bg-inv-muted/50" />
        <span className="inline-block size-2 rounded-full bg-inv-accent" />
        <span className="h-px w-12 bg-inv-muted/50" />
      </div>
    ),
    Corner: ({ className }) => <Perforations className={cn('h-2 w-40', className)} />,
    Glyph: ({ className }) => <span className={cn('inline-block size-2 rounded-full bg-inv-accent', className)} aria-hidden />,
    petals: null,
  },
}

export function useMotif(motif: ThemeConfig['motif']): MotifKit {
  return MOTIFS[motif]
}
