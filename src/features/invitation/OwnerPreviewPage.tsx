import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, EyeOff } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { RequireAuth } from '@/features/auth/guards'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { fetchWeddingPreview } from './ownerApi'
import { InvitationRenderer } from './engine/InvitationRenderer'
import { InvitationLoading, InvitationUnavailable } from './Unavailable'

/** The owner's view of their invitation, including drafts. Uses signed URLs for private media. */
export default function OwnerPreviewPage() {
  return (
    <RequireAuth>
      <OwnerPreview />
    </RequireAuth>
  )
}

function OwnerPreview() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const embed = params.get('embed') === '1'
  const q = useQuery({ queryKey: ['wedding-preview', id], queryFn: () => fetchWeddingPreview(id) })
  useDocumentMeta({ title: 'Preview · ShubhaVedhik', noindex: true })
  if (q.isLoading) return <InvitationLoading />
  if (q.isError || !q.data) return <InvitationUnavailable reason="error" />
  return (
    <>
      <InvitationRenderer template={q.data.template} data={q.data.data} mode={embed ? 'embed' : 'preview'} skipOpening={params.get('skip') === '1'} />
      {!embed && (
        <div className="fixed top-4 left-4 z-[60] flex flex-wrap items-center gap-2">
          <Link to={`/dashboard/weddings/${id}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-black/60 px-4 text-sm text-white backdrop-blur-md">
            <ArrowLeft className="size-4" aria-hidden /> Back
          </Link>
          {q.data.status !== 'published' && (
            <span className="inline-flex h-10 items-center gap-2 rounded-full bg-[#E7A626] px-4 text-sm text-[#2B1730]">
              <EyeOff className="size-4" aria-hidden /> Preview — guests can’t see this yet
            </span>
          )}
        </div>
      )}
    </>
  )
}
