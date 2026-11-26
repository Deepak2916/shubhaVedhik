import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { PageLoader, Tabs } from '@/components/ui/Primitives'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { getTemplate } from './api'
import { StatusTag } from './AdminTemplatesPage'

const DetailsTab = lazy(() => import('./editor/DetailsTab'))
const BuilderTab = lazy(() => import('./editor/BuilderTab'))
const VersionsTab = lazy(() => import('./editor/VersionsTab'))
const SampleDataTab = lazy(() => import('./editor/SampleDataTab'))

type Tab = 'builder' | 'details' | 'versions' | 'sample'

export default function AdminTemplateEditorPage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) ?? 'builder'
  const q = useQuery({ queryKey: ['admin-template', id], queryFn: () => getTemplate(id) })
  useDocumentMeta({ title: `${q.data?.name ?? 'Template'} · Admin`, noindex: true })
  if (q.isLoading) return <PageLoader />
  if (!q.data) return <p className="text-danger">{q.error?.message ?? 'Template not found'}</p>
  const t = q.data
  return (
    <div className="space-y-6">
      <Link to="/admin/templates" className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-plum">
        <ArrowLeft className="size-4" aria-hidden /> Templates
      </Link>
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="font-display text-4xl">{t.name}</h1>
        <StatusTag status={t.status} />
        {t.current_version_id && (
          <a href={`/preview/${t.slug}`} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 text-sm text-kumkum hover:underline">
            Live demo <ExternalLink className="size-3.5" aria-hidden />
          </a>
        )}
      </header>
      <Tabs<Tab>
        tabs={[
          { value: 'builder', label: 'Builder' },
          { value: 'details', label: 'Details' },
          { value: 'versions', label: 'Versions' },
          { value: 'sample', label: 'Sample wedding' },
        ]}
        value={tab}
        onChange={(v) => setParams({ tab: v }, { replace: true })}
      />
      <Suspense fallback={<PageLoader />}>
        {tab === 'details' && <DetailsTab t={t} />}
        {tab === 'builder' && <BuilderTab t={t} />}
        {tab === 'versions' && <VersionsTab t={t} />}
        {tab === 'sample' && <SampleDataTab t={t} />}
      </Suspense>
    </div>
  )
}
