/**
 * Shared SVG building blocks. All colours come from the invitation CSS
 * variables, so every motif adapts to customised palettes.
 */
import type { CSSProperties } from 'react'

const P = 'var(--inv-primary)'
const A = 'var(--inv-accent)'

/** clipPath definitions (objectBoundingBox) used by framed photos. Render once per invitation. */
export function ClipDefs() {
  return (
    <svg width="0" height="0" aria-hidden style={{ position: 'absolute' }}>
      <defs>
        <clipPath id="clip-arch" clipPathUnits="objectBoundingBox">
          <path d="M0,1 L0,0.36 C0,0.16 0.22,0 0.5,0 C0.78,0 1,0.16 1,0.36 L1,1 Z" />
        </clipPath>
        <clipPath id="clip-mihrab" clipPathUnits="objectBoundingBox">
          <path d="M0,1 L0,0.42 C0,0.29 0.1,0.21 0.24,0.15 C0.37,0.1 0.46,0.06 0.5,0 C0.54,0.06 0.63,0.1 0.76,0.15 C0.9,0.21 1,0.29 1,0.42 L1,1 Z" />
        </clipPath>
        <clipPath id="clip-temple" clipPathUnits="objectBoundingBox">
          <path d="M0,1 L0,0.4 Q0,0.31 0.07,0.29 Q0.09,0.19 0.18,0.17 Q0.23,0.08 0.33,0.08 Q0.4,0.01 0.5,0 Q0.6,0.01 0.67,0.08 Q0.77,0.08 0.82,0.17 Q0.91,0.19 0.93,0.29 Q1,0.31 1,0.4 L1,1 Z" />
        </clipPath>
      </defs>
    </svg>
  )
}

export const clipStyle = (id: 'arch' | 'mihrab' | 'temple'): CSSProperties => ({
  clipPath: `url(#clip-${id})`,
  WebkitClipPath: `url(#clip-${id})`,
})

/** Outline that traces a clip shape, drawn over a photo. */
export function FrameOutline({ shape, inset = 6 }: { shape: 'arch' | 'mihrab' | 'temple'; inset?: number }) {
  const d = {
    arch: 'M0,100 L0,36 C0,16 22,0 50,0 C78,0 100,16 100,36 L100,100',
    mihrab: 'M0,100 L0,42 C0,29 10,21 24,15 C37,10 46,6 50,0 C54,6 63,10 76,15 C90,21 100,29 100,42 L100,100',
    temple: 'M0,100 L0,40 Q0,31 7,29 Q9,19 18,17 Q23,8 33,8 Q40,1 50,0 Q60,1 67,8 Q77,8 82,17 Q91,19 93,29 Q100,31 100,40 L100,100',
  }[shape]
  return (
    <svg viewBox="-2 -2 104 104" preserveAspectRatio="none" className="pointer-events-none absolute -inset-[3px] size-[calc(100%+6px)]" aria-hidden>
      <path d={d} fill="none" stroke={P} strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      <path d={d} fill="none" stroke={A} strokeWidth="0.4" vectorEffect="non-scaling-stroke" transform={`translate(${inset / 10} ${inset / 10}) scale(${1 - inset / 50})`} opacity="0.7" />
    </svg>
  )
}

export function Lotus({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 40" width={size} height={(size * 40) / 64} className={className} aria-hidden>
      <g fill="none" stroke={P} strokeWidth="1.3" strokeLinejoin="round">
        <path d="M32 4c6 8 6 20 0 30-6-10-6-22 0-30z" fill={A} fillOpacity="0.25" />
        <path d="M32 34c-4-9-12-16-22-17 2 9 10 16 22 17z" />
        <path d="M32 34c4-9 12-16 22-17-2 9-10 16-22 17z" />
        <path d="M32 34C24 30 12 28 3 30c6 5 17 6 29 4z" />
        <path d="M32 34c8-4 20-6 29-4-6 5-17 6-29 4z" />
      </g>
    </svg>
  )
}

export function Diya({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden>
      <path className="anim-flicker" d="M24 6c4 6 5 10 0 16-5-6-4-10 0-16z" fill={A} />
      <path d="M24 12c2 3 2 5 0 8-2-3-2-5 0-8z" fill="#fff6d8" opacity=".85" />
      <path d="M6 28h36c-2 8-9 13-18 13S8 36 6 28z" fill={P} />
      <path d="M10 28c3-2 25-2 28 0" stroke={A} strokeWidth="1.2" fill="none" />
    </svg>
  )
}

export function Kalash({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 72" width={size} height={(size * 72) / 64} className={className} aria-hidden>
      <g stroke={P} strokeWidth="1.4" fill="none" strokeLinejoin="round">
        <path d="M22 22c-3-6-1-12 4-14M42 22c3-6 1-12-4-14M32 18c0-6 0-10 0-14" />
        <ellipse cx="32" cy="16" rx="7" ry="6" fill={A} fillOpacity=".35" />
        <path d="M20 24h24l-3 6H23z" fill={P} fillOpacity=".25" />
        <path d="M23 30c-9 6-11 18-5 27 4 6 9 9 14 9s10-3 14-9c6-9 4-21-5-27z" fill={P} fillOpacity=".18" />
        <path d="M17 44h30M19 52h26" />
        <circle cx="32" cy="48" r="3" fill={A} />
      </g>
    </svg>
  )
}

export function Star8({ size = 28, className, style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} style={style} aria-hidden>
      <g fill="none" stroke={P} strokeWidth="1.3">
        <rect x="9" y="9" width="22" height="22" />
        <rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)" />
        <circle cx="20" cy="20" r="4" fill={A} fillOpacity=".6" />
      </g>
    </svg>
  )
}

export function Sprig({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 120 40" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
      <g fill="none" stroke={A} strokeWidth="1.2" strokeLinecap="round">
        <path d="M4 30C34 30 70 22 116 8" />
        {[18, 38, 58, 78, 98].map((x, i) => (
          <g key={x} transform={`translate(${x} ${28 - i * 4.4})`}>
            <path d="M0 0c-3-7 0-13 7-15 1 7-2 12-7 15z" fill={A} fillOpacity=".25" />
            <path d="M0 0c6 2 12 0 15-6-7-2-12 0-15 6z" fill={A} fillOpacity=".18" />
          </g>
        ))}
      </g>
      <circle cx="116" cy="8" r="4" fill={P} fillOpacity=".55" />
    </svg>
  )
}

export function Blossom({ size = 48, className, style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} className={className} style={style} aria-hidden>
      <g transform="translate(30 30)">
        {[0, 72, 144, 216, 288].map((r) => (
          <path key={r} d="M0 0C-9-6-10-20 0-26 10-20 9-6 0 0z" fill={P} fillOpacity=".22" stroke={P} strokeWidth="1" transform={`rotate(${r})`} />
        ))}
        <circle r="4.5" fill={A} />
      </g>
    </svg>
  )
}

export function Marigold({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#F29F05" />
      <circle cx="12" cy="12" r="8" fill="#F7B32B" />
      <circle cx="12" cy="12" r="5" fill="#FFC94A" />
      <g stroke="#D97F00" strokeWidth=".8" opacity=".7">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M12 2v5" transform={`rotate(${i * 30} 12 12)`} />
        ))}
      </g>
    </svg>
  )
}

export function MangoLeaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 44" className={className} aria-hidden>
      <path d="M10 0C17 12 17 30 10 44 3 30 3 12 10 0z" fill="#3F7A3A" />
      <path d="M10 2v40" stroke="#9BC48F" strokeWidth=".8" />
    </svg>
  )
}

/** Mango-leaf thoranam with marigolds — hangs across the top of temple/festive sections. */
export function Thoranam({ className }: { className?: string }) {
  const count = 15
  return (
    <div className={className} aria-hidden>
      <div className="relative h-14 w-full overflow-hidden">
        <div className="absolute inset-x-0 top-2 h-px" style={{ background: P }} />
        <div className="absolute inset-x-0 top-0 flex justify-between px-1">
          {Array.from({ length: count }, (_, i) =>
            i % 2 === 0 ? <MangoLeaf key={i} className="mt-1 h-11 w-5 anim-sway" /> : <Marigold key={i} size={16} className="mt-0.5" />,
          )}
        </div>
      </div>
    </div>
  )
}

/** Swagged marigold garland strings (festive). */
export function GarlandSwags({ className, swags = 4 }: { className?: string; swags?: number }) {
  return (
    <svg viewBox={`0 0 ${swags * 100} 60`} preserveAspectRatio="none" className={className} aria-hidden>
      {Array.from({ length: swags }, (_, s) => (
        <g key={s}>
          {Array.from({ length: 11 }, (_, i) => {
            const t = i / 10
            const x = s * 100 + t * 100
            const y = 6 + Math.sin(Math.PI * t) * 38
            return <circle key={i} cx={x} cy={y} r={i % 2 ? 5.5 : 6.5} fill={i % 3 === 0 ? '#F7B32B' : i % 3 === 1 ? '#F29F05' : '#E0450B'} />
          })}
          <path d={`M${s * 100 + 50} 44 v12`} stroke="#3F7A3A" strokeWidth="2" />
          <circle cx={s * 100 + 50} cy={58} r={3} fill="#C81D63" />
        </g>
      ))}
    </svg>
  )
}

/** Concentric mandala; slow CSS rotation only when ambient motion is on. */
export function Mandala({ className, spin }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden>
      <g className={spin ? 'anim-spin-slow' : undefined} style={{ transformOrigin: 'center', transformBox: 'fill-box' }} fill="none" stroke={P} strokeWidth=".6">
        {[92, 78, 60, 40].map((r) => (
          <circle key={r} r={r} opacity=".5" />
        ))}
        {Array.from({ length: 24 }, (_, i) => (
          <path key={`p${i}`} d="M0-92C8-80 8-66 0-60-8-66-8-80 0-92z" transform={`rotate(${i * 15})`} fill={A} fillOpacity=".12" />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <path key={`q${i}`} d="M0-60C10-52 10-44 0-40-10-44-10-52 0-60z" transform={`rotate(${i * 22.5})`} fill={P} fillOpacity=".12" />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={`c${i}`} cx="0" cy="-30" r="5" transform={`rotate(${i * 30})`} fill={A} fillOpacity=".3" />
        ))}
        <circle r="12" fill={P} fillOpacity=".2" />
      </g>
    </svg>
  )
}

export function Lantern({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 120" className={className} aria-hidden>
      <path d="M20 0v34" stroke={P} strokeWidth="1" />
      <g className="anim-sway" style={{ transformOrigin: '20px 34px' }}>
        <path d="M14 34h12l-2 6h-8z" fill={P} />
        <path d="M12 40h16l6 22-6 24H12L6 62z" fill={P} fillOpacity=".2" stroke={P} strokeWidth="1.2" />
        <path d="M20 40v46M9 62h22" stroke={P} strokeWidth=".8" opacity=".6" />
        <ellipse className="anim-flicker" cx="20" cy="64" rx="5" ry="8" fill={A} opacity=".9" />
        <path d="M12 86h16l-4 6h-8z" fill={P} />
        <path d="M20 92v10" stroke={P} />
        <circle cx="20" cy="104" r="2.5" fill={A} />
      </g>
    </svg>
  )
}

/** Film perforation strip (sprocket holes). */
export function Perforations({ className, vertical }: { className?: string; vertical?: boolean }) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        backgroundImage: `repeating-linear-gradient(${vertical ? '180deg' : '90deg'}, color-mix(in oklab, var(--inv-text) 26%, transparent) 0 12px, transparent 12px 24px)`,
        borderRadius: 2,
      }}
    />
  )
}
