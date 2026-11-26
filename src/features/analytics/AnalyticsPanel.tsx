import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Monitor, QrCode, Smartphone, Tablet, Link2 } from 'lucide-react'
import { useState } from 'react'
import { Panel, Skeleton } from '@/components/ui/Primitives'
import { getAnalytics } from '@/features/weddings/api'
import type { WeddingAnalytics } from '@/types/db'

function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-paper px-4 py-4 ring-1 ring-rose/70">
      <p className="flex items-center gap-1.5 text-sm text-mist">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value.toLocaleString('en-IN')}</p>
    </div>
  )
}

/** Single-series daily bar chart: one hue, rounded data ends, 2px gaps, hover tooltip, table fallback. */
function DailyChart({ daily }: { daily: WeddingAnalytics['daily'] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(4, ...daily.map((d) => d.visits))
  const ticks = [0, Math.ceil(max / 2), max]
  const W = 600
  const H = 180
  const pad = { l: 28, b: 22, t: 8 }
  const bw = (W - pad.l) / daily.length
  const y = (v: number) => H - pad.b - (v / max) * (H - pad.b - pad.t)
  const active = hover !== null ? daily[hover] : null
  return (
    <figure>
      <figcaption className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-medium">Visits per day</span>
        <span className="text-mist tabular-nums">{active ? `${format(parseISO(active.day), 'EEE d MMM')}: ${active.visits} visits, ${active.unique} unique` : 'Last 30 days'}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Bar chart of visits per day for the last 30 days" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W} y1={y(t)} y2={y(t)} stroke="#E9D0D1" strokeWidth="1" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#6F5866">
              {t}
            </text>
          </g>
        ))}
        {daily.map((d, i) => {
          const x = pad.l + i * bw + 1
          const h = H - pad.b - y(d.visits)
          const w = Math.max(2, bw - 2)
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={0} aria-label={`${d.day}: ${d.visits} visits`}>
              <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.b - pad.t} fill="transparent" />
              {d.visits > 0 && <path d={`M${x},${H - pad.b} v${-(h - 4)} q0,-4 4,-4 h${w - 8} q4,0 4,4 v${h - 4} z`} fill={hover === i ? '#7C1230' : '#9E1B3C'} />}
            </g>
          )
        })}
        {[0, Math.floor(daily.length / 2), daily.length - 1].map((i) =>
          daily[i] ? (
            <text key={i} x={pad.l + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#6F5866">
              {format(parseISO(daily[i].day), 'd MMM')}
            </text>
          ) : null,
        )}
      </svg>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-mist">View as table</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead>
            <tr className="text-mist">
              <th className="py-1 font-normal">Day</th>
              <th className="py-1 font-normal">Visits</th>
              <th className="py-1 font-normal">Unique</th>
            </tr>
          </thead>
          <tbody>
            {daily
              .filter((d) => d.visits > 0)
              .map((d) => (
                <tr key={d.day} className="border-t border-rose/60">
                  <td className="py-1">{format(parseISO(d.day), 'd MMM yyyy')}</td>
                  <td>{d.visits}</td>
                  <td>{d.unique}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

export function AnalyticsPanel({ weddingId }: { weddingId: string }) {
  const q = useQuery({ queryKey: ['analytics', weddingId], queryFn: () => getAnalytics(weddingId, 30), refetchInterval: 60_000 })
  return (
    <Panel title="Guest visits" description="Anonymous counts — no guest names, IP addresses or tracking cookies.">
      {q.isLoading || !q.data ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Total visits" value={q.data.totalVisits} />
            <Stat label="Unique visitors" value={q.data.uniqueVisitors} />
            <Stat label="From QR scans" value={q.data.bySource.qr ?? 0} icon={<QrCode className="size-3.5" aria-hidden />} />
            <Stat label="From links" value={q.data.bySource.link ?? 0} icon={<Link2 className="size-3.5" aria-hidden />} />
          </div>
          <DailyChart daily={q.data.daily ?? []} />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-mist">
            <span className="inline-flex items-center gap-1.5"><Smartphone className="size-4" aria-hidden /> Phones {q.data.byDevice.mobile ?? 0}</span>
            <span className="inline-flex items-center gap-1.5"><Tablet className="size-4" aria-hidden /> Tablets {q.data.byDevice.tablet ?? 0}</span>
            <span className="inline-flex items-center gap-1.5"><Monitor className="size-4" aria-hidden /> Computers {q.data.byDevice.desktop ?? 0}</span>
            <span>Music played {q.data.interactions.play_music ?? 0}</span>
            <span>Directions opened {q.data.interactions.open_map ?? 0}</span>
          </div>
        </div>
      )}
    </Panel>
  )
}
