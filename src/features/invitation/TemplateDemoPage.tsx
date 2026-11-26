import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { fetchTemplatePreview } from './publicApi'
import { InvitationRenderer } from './engine/InvitationRenderer'
import { InvitationLoading, InvitationUnavailable } from './Unavailable'

/** Full-screen live demo of a template with its sample wedding. ?embed=1 hides chrome, ?skip=1 skips the opening. */
export default function TemplateDemoPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const embed = params.get('embed') === '1'
  const version = params.get('version') ?? undefined
  const q = useQuery({ queryKey: ['template-preview', slug, version], queryFn: () => fetchTemplatePreview(slug, version), staleTime: 5 * 60_000 })
  useDocumentMeta({ title: q.data ? `${q.data.template.name} — live demo · ShubhaVedhik` : 'Template demo · ShubhaVedhik', noindex: embed })

  if (q.isLoading) return <InvitationLoading />
  if (q.isError || !q.data) return <InvitationUnavailable reason={q.isError ? 'error' : 'unavailable'} />
  return (
    <>
      <InvitationRenderer template={q.data.template} data={q.data.data} mode={embed ? 'embed' : 'preview'} skipOpening={params.get('skip') === '1'} />
      {!embed && (
        <div className="fixed top-4 left-4 z-[60] flex items-center gap-2">
          <Link to={`/templates/${slug}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-black/55 px-4 text-sm text-white backdrop-blur-md hover:bg-black/70">
            <ArrowLeft className="size-4" aria-hidden /> {q.data.template.name}
          </Link>
          <Link to={`/register?template=${slug}`} className="hidden h-10 items-center rounded-full bg-[#E7A626] px-4 text-sm font-medium text-[#2B1730] sm:inline-flex">
            Use this design
          </Link>
        </div>
      )}
    </>
  )
}
