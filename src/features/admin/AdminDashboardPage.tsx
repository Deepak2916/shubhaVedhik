import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'
import { Panel, Skeleton } from '@/components/ui/Primitives'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { getDashboard } from './api'

const ACTIVITY: Record<string, string> = { wedding_created: 'New wedding', wedding_published: 'Published', version_published: 'Template version published' }

export default function AdminDashboardPage() {
  useDocumentMeta({ title: 'Admin · ShubhaVedhik', noindex: true })
  const q = useQuery({ queryKey: ['admin-dashboard'], queryFn: getDashboard, refetchInterval: 60_000 })
  const d = q.data
  const tiles: [string, number | undefined][] = [
    ['Customers', d?.customers],
    ['Weddings', d?.weddings],
    ['Published', d?.published],
    ['Drafts & offline', d?.drafts],
    ['Templates', d?.templates],
    ['Live templates', d?.activeTemplates],
    ['Guest visits, 30 days', d?.visits30d],
  ]
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl">Overview</h1>
      {q.isError && <p className="text-danger">{q.error.message}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-4 shadow-card ring-1 ring-rose/60">
            <p className="text-sm text-mist">{label}</p>
            {value === undefined ? <Skeleton className="mt-2 h-8 w-16" /> : <p className="mt-1 font-display text-3xl tabular-nums">{value.toLocaleString('en-IN')}</p>}
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Most used templates">
          <ol className="space-y-3">
            {d?.popular.map((t) => (
              <li key={t.id} className="flex items-center gap-3">
                <span className="size-12 shrink-0 overflow-hidden rounded-xl bg-blush">{t.coverImageUrl && <img src={t.coverImageUrl.replace(/\.webp$/, '-sm.webp')} alt="" className="size-full object-cover" />}</span>
                <Link to={`/admin/templates/${t.id}`} className="flex-1 font-medium hover:text-kumkum">{t.name}</Link>
                <span className="text-sm text-mist tabular-nums">{t.uses} weddings</span>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Recent activity">
          <ul className="divide-y divide-rose/60">
            {d?.recent.length === 0 && <li className="py-3 text-mist">Nothing yet.</li>}
            {d?.recent.map((r, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                <span>
                  <span className="text-mist">{ACTIVITY[r.kind]}:</span> {r.label}
                </span>
                <span className="shrink-0 text-mist">{formatDistanceToNow(new Date(r.at), { addSuffix: true })}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
