import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Eye, HeartHandshake, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Badge, EmptyState, Skeleton } from '@/components/ui/Primitives'
import { listMyWeddings, type WeddingListItem } from '@/features/weddings/api'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { formatDate } from '@/lib/format'
import { NewWeddingDialog } from './NewWeddingDialog'

export function StatusBadge({ status }: { status: WeddingListItem['status'] }) {
  if (status === 'published') return <Badge tone="success">Published</Badge>
  if (status === 'unpublished') return <Badge tone="warning">Offline</Badge>
  return <Badge>Draft</Badge>
}

function WeddingCard({ w }: { w: WeddingListItem }) {
  const img = w.coverUrl ?? w.template?.cover_image_url?.replace(/\.webp$/, '-sm.webp')
  return (
    <article className="flex flex-col overflow-hidden rounded-[22px] bg-white shadow-card ring-1 ring-rose/60">
      <Link to={`/dashboard/weddings/${w.id}`} className="relative block aspect-[16/10] bg-blush">
        {img && <img src={img} alt="" loading="lazy" className="size-full object-cover" />}
        <span className="absolute top-3 left-3">
          <StatusBadge status={w.status} />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-display text-2xl leading-tight">
          <Link to={`/dashboard/weddings/${w.id}`} className="hover:text-kumkum">
            {w.bride_name || 'Bride'} &amp; {w.groom_name || 'Groom'}
          </Link>
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-mist">
          <CalendarDays className="size-4" aria-hidden /> {w.wedding_date ? formatDate(w.wedding_date, 'd MMM yyyy') : 'Date not set'}
          {w.template && <span className="truncate">— {w.template.name}</span>}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink to={`/dashboard/weddings/${w.id}/edit/details`} size="sm" variant="secondary" icon={<Pencil className="size-3.5" aria-hidden />}>
            Edit
          </ButtonLink>
          <ButtonLink to={`/dashboard/weddings/${w.id}/preview`} size="sm" variant="ghost" icon={<Eye className="size-3.5" aria-hidden />}>
            Preview
          </ButtonLink>
          <ButtonLink to={`/dashboard/weddings/${w.id}`} size="sm" variant="ghost" className="ml-auto">
            Share &amp; stats
          </ButtonLink>
        </div>
      </div>
    </article>
  )
}

export default function DashboardHome() {
  useDocumentMeta({ title: 'My weddings · ShubhaVedhik', noindex: true })
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(params.get('new') === '1')
  const q = useQuery({ queryKey: ['weddings'], queryFn: listMyWeddings })
  const close = () => {
    setOpen(false)
    if (params.has('new')) setParams({}, { replace: true })
  }
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">My weddings</h1>
          <p className="mt-1 text-mist">Each wedding has its own invitation, link and QR code.</p>
        </div>
        <Button onClick={() => setOpen(true)} icon={<Plus className="size-4" aria-hidden />}>
          New wedding
        </Button>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {q.isLoading && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-80 rounded-[22px]" />)}
        {q.data?.map((w) => <WeddingCard key={w.id} w={w} />)}
      </div>
      {q.isError && <p className="mt-6 text-danger">{q.error.message}</p>}
      {q.data?.length === 0 && (
        <EmptyState
          icon={<HeartHandshake className="size-10" />}
          title="Your first invitation starts here"
          body="Add the couple’s names to begin. You’ll pick a design, add events and photos, and publish when you’re ready."
          action={<Button onClick={() => setOpen(true)}>Create a wedding</Button>}
        />
      )}
      <NewWeddingDialog open={open} onClose={close} templateSlug={params.get('template')} />
    </>
  )
}
