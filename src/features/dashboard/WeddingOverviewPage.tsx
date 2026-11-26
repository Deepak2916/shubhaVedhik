import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft, CheckCircle2, CircleDashed, Eye, Pencil, Rocket, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { PageLoader, Panel } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { AnalyticsPanel } from '@/features/analytics/AnalyticsPanel'
import { deleteWedding, getWedding, publishIssues, publishWedding, unpublishWedding, upgradeTemplate } from '@/features/weddings/api'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { formatDate } from '@/lib/format'
import { StatusBadge } from './DashboardHome'
import { SharePanel } from './SharePanel'

export default function WeddingOverviewPage() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState<'delete' | 'unpublish' | null>(null)
  const w = useQuery({ queryKey: ['wedding', id], queryFn: () => getWedding(id) })
  const issues = useQuery({ queryKey: ['publish-issues', id], queryFn: () => publishIssues(id), enabled: Boolean(w.data) })
  useDocumentMeta({ title: w.data ? `${w.data.bride_name} & ${w.data.groom_name} · ShubhaVedhik` : 'Wedding · ShubhaVedhik', noindex: true })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['wedding', id] })
    qc.invalidateQueries({ queryKey: ['weddings'] })
    qc.invalidateQueries({ queryKey: ['publish-issues', id] })
  }
  const publish = useMutation({ mutationFn: () => publishWedding(id), onSuccess: () => (refresh(), toast.success('Published — your invitation is live')), onError: (e) => toast.error(e.message) })
  const unpublish = useMutation({ mutationFn: () => unpublishWedding(id), onSuccess: () => (refresh(), setConfirm(null), toast.success('Invitation taken offline')), onError: (e) => toast.error(e.message) })
  const upgrade = useMutation({ mutationFn: () => upgradeTemplate(id), onSuccess: () => (refresh(), toast.success('Design updated to the latest version')), onError: (e) => toast.error(e.message) })
  const remove = useMutation({
    mutationFn: () => deleteWedding(w.data!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weddings'] })
      toast.success('Wedding deleted')
      navigate('/dashboard', { replace: true })
    },
    onError: (e) => toast.error(e.message),
  })

  if (w.isLoading) return <PageLoader />
  if (!w.data) return <p className="text-danger">{w.error?.message ?? 'Wedding not found.'}</p>
  const d = w.data
  const ready = issues.data?.length === 0
  const upgradeAvailable = d.template && d.template.current_version_id && d.template.current_version_id !== d.template_version_id

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-plum">
        <ArrowLeft className="size-4" aria-hidden /> All weddings
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[clamp(2rem,5vw,3rem)] leading-none">
              {d.bride_name} &amp; {d.groom_name}
            </h1>
            <StatusBadge status={d.status} />
          </div>
          <p className="mt-2 text-mist">
            {d.wedding_date ? formatDate(d.wedding_date) : 'Date not set'}
            {d.template && ` — ${d.template.name} design`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to={`/dashboard/weddings/${id}/edit/details`} variant="secondary" icon={<Pencil className="size-4" aria-hidden />}>
            Edit invitation
          </ButtonLink>
          <ButtonLink to={`/dashboard/weddings/${id}/preview`} variant="secondary" icon={<Eye className="size-4" aria-hidden />}>
            Preview
          </ButtonLink>
          {d.status === 'published' ? (
            <Button variant="ghost" onClick={() => setConfirm('unpublish')}>
              Take offline
            </Button>
          ) : (
            <Button icon={<Rocket className="size-4" aria-hidden />} onClick={() => publish.mutate()} loading={publish.isPending} disabled={!ready}>
              Publish
            </Button>
          )}
        </div>
      </header>

      {upgradeAvailable && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-haldi-soft/50 px-5 py-4 ring-1 ring-haldi/50">
          <Sparkles className="size-5 text-[#7a5300]" aria-hidden />
          <p className="flex-1 text-sm">A newer version of the {d.template?.name} design is available. Your invitation stays exactly as it is unless you update.</p>
          <ButtonLink to={`/dashboard/weddings/${id}/edit/template`} size="sm" variant="ghost">Compare</ButtonLink>
          <Button size="sm" variant="secondary" loading={upgrade.isPending} onClick={() => upgrade.mutate()}>
            Update design
          </Button>
        </div>
      )}

      {d.status !== 'published' && (
        <Panel title={ready ? 'Ready to publish' : 'Before you publish'} description={ready ? 'Everything required is in place. Publishing makes the link and QR code work for guests.' : 'Guests can’t see drafts. Complete these to publish:'}>
          {ready ? (
            <p className="flex items-center gap-2 text-leaf">
              <CheckCircle2 className="size-5" aria-hidden /> All set
            </p>
          ) : (
            <ul className="space-y-2">
              {issues.data?.map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <CircleDashed className="size-4 text-haldi" aria-hidden /> {i}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      <SharePanel w={d} />
      {d.published_at && <AnalyticsPanel weddingId={id} />}

      <Panel title="Delete this wedding" description="Removes the invitation, every photo, video and song, and its statistics. This can’t be undone.">
        <Button variant="danger" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => setConfirm('delete')}>
          Delete wedding
        </Button>
      </Panel>

      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this wedding?"
        body={`${d.bride_name} & ${d.groom_name}’s invitation and all uploaded media will be permanently deleted. The link and QR code will stop working.`}
        confirmLabel="Delete permanently"
        danger
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'unpublish'}
        title="Take the invitation offline?"
        body="Guests opening the link or QR code will see a ‘not available’ page until you publish again. Nothing is deleted."
        confirmLabel="Take offline"
        loading={unpublish.isPending}
        onConfirm={() => unpublish.mutate()}
        onClose={() => setConfirm(null)}
      />
      {!d.template && (
        <p className="flex items-center gap-2 text-sm text-mist">
          <AlertTriangle className="size-4" aria-hidden /> No design selected yet.
        </p>
      )}
    </div>
  )
}
