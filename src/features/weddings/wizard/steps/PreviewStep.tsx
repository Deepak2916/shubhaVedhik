import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, CircleDashed, ExternalLink, Rocket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Panel, Skeleton } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { LivePreviewFrame } from '@/components/LivePreviewFrame'
import { fetchWeddingPreview } from '@/features/invitation/ownerApi'
import { publishIssues, publishWedding } from '../../api'
import { useWizard } from '../context'
import { StepFrame } from '../StepFrame'

export default function PreviewStep() {
  const { wedding: w, refresh } = useWizard()
  const toast = useToast()
  const navigate = useNavigate()
  const preview = useQuery({ queryKey: ['wedding-preview', w.id], queryFn: () => fetchWeddingPreview(w.id), retry: false })
  const issues = useQuery({ queryKey: ['publish-issues', w.id], queryFn: () => publishIssues(w.id) })
  const publish = useMutation({
    mutationFn: () => publishWedding(w.id),
    onSuccess: async () => {
      await refresh()
      toast.success('Published — your invitation is live')
      navigate(`/dashboard/weddings/${w.id}`)
    },
    onError: (e) => toast.error(e.message),
  })
  const ready = issues.data?.length === 0
  const live = w.status === 'published'

  return (
    <StepFrame
      title="Preview & publish"
      description="This is exactly what guests will see. Switch between phone and desktop, and replay the opening."
      continueLabel={live ? 'Done' : 'Publish invitation'}
      saving={publish.isPending}
      onContinue={() => {
        if (live) {
          navigate(`/dashboard/weddings/${w.id}`)
          return false
        }
        if (!ready) {
          toast.error('Complete the checklist before publishing.')
          return false
        }
        publish.mutate()
        return false
      }}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        {preview.isLoading && <Skeleton className="h-[70vh]" />}
        {preview.isError && <Panel title="Preview unavailable" description={preview.error.message}>{!w.template_id && <ButtonLink to={`/dashboard/weddings/${w.id}/edit/template`}>Choose a design</ButtonLink>}</Panel>}
        {preview.data && <LivePreviewFrame template={preview.data.template} data={preview.data.data} showOpening className="h-[78vh]" />}
        <div className="space-y-4">
          <Panel title={live ? 'Live' : ready ? 'Ready to publish' : 'Checklist'}>
            {live ? (
              <p className="flex items-center gap-2 text-leaf"><CheckCircle2 className="size-5" aria-hidden /> Guests can open your invitation.</p>
            ) : ready ? (
              <p className="flex items-center gap-2 text-leaf"><CheckCircle2 className="size-5" aria-hidden /> Everything required is done.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {issues.data?.map((i) => <li key={i} className="flex items-center gap-2"><CircleDashed className="size-4 text-haldi" aria-hidden /> {i}</li>)}
              </ul>
            )}
            {!live && (
              <Button className="mt-5 w-full" icon={<Rocket className="size-4" aria-hidden />} disabled={!ready} loading={publish.isPending} onClick={() => publish.mutate()}>
                Publish invitation
              </Button>
            )}
          </Panel>
          <ButtonLink to={`/dashboard/weddings/${w.id}/preview`} variant="secondary" className="w-full" icon={<ExternalLink className="size-4" aria-hidden />}>
            Open full screen
          </ButtonLink>
        </div>
      </div>
    </StepFrame>
  )
}
