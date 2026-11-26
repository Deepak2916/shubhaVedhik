import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import { Badge, Panel, Skeleton } from '@/components/ui/Primitives'
import { listVersions, type AdminTemplate } from '../api'

export default function VersionsTab({ t }: { t: AdminTemplate }) {
  const q = useQuery({ queryKey: ['admin-versions', t.id], queryFn: () => listVersions(t.id) })
  return (
    <Panel title="Version history" description="Each wedding is pinned to the version it was created with. Customers choose when to move to a newer one.">
      {q.isLoading && <Skeleton className="h-40" />}
      <ol className="divide-y divide-rose/60">
        {q.data?.map((v) => (
          <li key={v.id} className="flex flex-wrap items-center gap-4 py-4">
            <span className="font-display text-2xl">v{v.version}</span>
            <Badge tone={v.status === 'published' ? 'success' : v.status === 'draft' ? 'warning' : 'neutral'}>{v.status === 'published' ? 'Current' : v.status === 'draft' ? 'Draft' : 'Retired'}</Badge>
            <div className="min-w-48 flex-1">
              <p className="text-sm">{v.changelog ?? '—'}</p>
              <p className="text-xs text-mist">{v.published_at ? `Published ${format(new Date(v.published_at), 'd MMM yyyy, HH:mm')}` : `Created ${format(new Date(v.created_at), 'd MMM yyyy')}`}</p>
            </div>
            <span className="text-sm text-mist tabular-nums">{v.weddings} wedding{v.weddings === 1 ? '' : 's'}</span>
            <a href={`/preview/${t.slug}?version=${v.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-kumkum hover:underline">
              Preview <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
