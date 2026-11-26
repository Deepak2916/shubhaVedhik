import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check } from 'lucide-react'
import { lazy, Suspense, useMemo } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { PageLoader } from '@/components/ui/Primitives'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { cn } from '@/lib/cn'
import { getWedding } from '../api'
import { STEPS, WizardContext, type StepKey, type WizardContextValue } from './context'

const STEP_COMPONENTS: Record<StepKey, React.LazyExoticComponent<React.ComponentType>> = {
  details: lazy(() => import('./steps/DetailsStep')),
  culture: lazy(() => import('./steps/CultureStep')),
  template: lazy(() => import('./steps/TemplateStep')),
  photos: lazy(() => import('./steps/PhotosStep')),
  videos: lazy(() => import('./steps/VideosStep')),
  music: lazy(() => import('./steps/MusicStep')),
  events: lazy(() => import('./steps/EventsStep')),
  messages: lazy(() => import('./steps/MessagesStep')),
  preview: lazy(() => import('./steps/PreviewStep')),
}

export default function WeddingWizard() {
  const { id = '', step = 'details' } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['wedding', id], queryFn: () => getWedding(id) })
  const index = STEPS.findIndex((s) => s.key === step)
  useDocumentMeta({ title: `${STEPS[index]?.label ?? 'Edit'} · ShubhaVedhik`, noindex: true })

  const ctx = useMemo<WizardContextValue | null>(() => {
    if (!q.data) return null
    const go = (i: number) => {
      const s = STEPS[Math.max(0, Math.min(STEPS.length - 1, i))]
      navigate(`/dashboard/weddings/${id}/edit/${s.key}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    return {
      wedding: q.data,
      refresh: async () => {
        await qc.invalidateQueries({ queryKey: ['wedding', id] })
        await qc.invalidateQueries({ queryKey: ['weddings'] })
        await qc.invalidateQueries({ queryKey: ['wedding-preview', id] })
        await qc.invalidateQueries({ queryKey: ['publish-issues', id] })
      },
      next: () => go(index + 1),
      back: () => go(index - 1),
    }
  }, [q.data, qc, id, index, navigate])

  if (index < 0) return <Navigate to={`/dashboard/weddings/${id}/edit/details`} replace />
  if (q.isLoading) return <PageLoader />
  if (!ctx) return <p className="text-danger">{q.error?.message ?? 'Wedding not found.'}</p>
  const Step = STEP_COMPONENTS[STEPS[index].key]

  return (
    <WizardContext.Provider value={ctx}>
      <Link to={`/dashboard/weddings/${id}`} className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-plum">
        <ArrowLeft className="size-4" aria-hidden /> {ctx.wedding.bride_name} &amp; {ctx.wedding.groom_name}
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[230px_1fr]">
        <nav aria-label="Invitation steps" className="lg:sticky lg:top-24 lg:self-start">
          <ol className="snap-row gap-2 lg:flex-col lg:gap-1 lg:overflow-visible">
            {STEPS.map((s, i) => (
              <li key={s.key} className="shrink-0">
                <Link
                  to={`/dashboard/weddings/${id}/edit/${s.key}`}
                  aria-current={i === index ? 'step' : undefined}
                  className={cn('flex h-10 items-center gap-3 rounded-full px-3 text-sm transition lg:rounded-xl', i === index ? 'bg-plum text-paper' : 'text-plum-soft hover:bg-blush')}
                >
                  <span className={cn('grid size-6 shrink-0 place-items-center rounded-full text-xs', i === index ? 'bg-haldi text-plum' : i < index ? 'bg-leaf/15 text-leaf' : 'bg-blush')}>
                    {i < index ? <Check className="size-3.5" aria-hidden /> : i + 1}
                  </span>
                  {s.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <section className="min-w-0" aria-labelledby="step-title">
          <Suspense fallback={<PageLoader />}>
            <Step key={STEPS[index].key} />
          </Suspense>
        </section>
      </div>
    </WizardContext.Provider>
  )
}
