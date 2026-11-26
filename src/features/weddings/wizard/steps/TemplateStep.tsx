import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, Eye, Monitor, RotateCcw, Smartphone, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { ColorField } from '@/components/ui/Field'
import { Badge, Panel, Skeleton } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { fetchTemplatePreview } from '@/features/invitation/publicApi'
import { usePublishedTemplates, type CatalogTemplate } from '@/features/templates/api'
import { cn } from '@/lib/cn'
import { languageName } from '@/lib/languages'
import { selectTemplate, updateWedding, upgradeTemplate } from '../../api'
import { useWizard } from '../context'
import { StepFrame } from '../StepFrame'

function PreviewDialog({ t, onClose, onUse, using }: { t: CatalogTemplate | null; onClose: () => void; onUse: () => void; using: boolean }) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')
  return (
    <Dialog
      open={Boolean(t)}
      onClose={onClose}
      size="xl"
      title={t ? `${t.name} — live demo` : ''}
      description={t?.tagline ?? undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button onClick={onUse} loading={using}>Use this design</Button>
        </>
      }
    >
      <div className="mb-4 inline-flex rounded-full bg-blush p-1" role="radiogroup" aria-label="Preview device">
        {(['mobile', 'desktop'] as const).map((d) => (
          <button key={d} type="button" role="radio" aria-checked={device === d} onClick={() => setDevice(d)} className={cn('inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm', device === d ? 'bg-white shadow-card' : 'text-mist')}>
            {d === 'mobile' ? <Smartphone className="size-4" aria-hidden /> : <Monitor className="size-4" aria-hidden />} {d === 'mobile' ? 'Mobile' : 'Desktop'}
          </button>
        ))}
      </div>
      {t && (
        <div className={cn('mx-auto overflow-hidden rounded-[20px] bg-black shadow-lift', device === 'mobile' ? 'h-[70vh] w-[min(100%,390px)]' : 'relative aspect-[16/10] w-full')}>
          <iframe
            title={`${t.name} preview`}
            src={`/preview/${t.slug}?embed=1`}
            className={cn('border-0', device === 'mobile' ? 'size-full' : 'absolute top-0 left-0 h-[200%] w-[200%] origin-top-left scale-50')}
          />
        </div>
      )}
    </Dialog>
  )
}

export default function TemplateStep() {
  const { wedding: w, refresh } = useWizard()
  const toast = useToast()
  const templates = usePublishedTemplates()
  const [previewing, setPreviewing] = useState<CatalogTemplate | null>(null)
  const [overrides, setOverrides] = useState<Record<string, string>>(w.theme_overrides ?? {})

  const current = templates.data?.find((t) => t.id === w.template_id)
  const preset = useQuery({ queryKey: ['template-preview', current?.slug], queryFn: () => fetchTemplatePreview(current!.slug), enabled: Boolean(current) })
  const palette = preset.data?.template.config.theme.palette
  const customizable = preset.data?.template.config.customizable.palette

  const choose = useMutation({
    mutationFn: (t: CatalogTemplate) => selectTemplate(w.id, t.id),
    onSuccess: async (_, t) => {
      setOverrides({})
      await updateWedding(w.id, { theme_overrides: {} })
      await refresh()
      setPreviewing(null)
      toast.success(`${t.name} selected`)
    },
    onError: (e) => toast.error(e.message),
  })
  const upgrade = useMutation({ mutationFn: () => upgradeTemplate(w.id), onSuccess: async () => (await refresh(), toast.success('Design updated')), onError: (e) => toast.error(e.message) })
  const saveColours = useMutation({ mutationFn: () => updateWedding(w.id, { theme_overrides: overrides }), onSuccess: async () => (await refresh(), toast.success('Colours saved')), onError: (e) => toast.error(e.message) })

  const upgradeAvailable = w.template?.current_version_id && w.template.current_version_id !== w.template_version_id

  return (
    <StepFrame
      title="Choose a design"
      description="Every design works with every tradition and language. Open a live demo to experience it the way guests will."
      onContinue={() => {
        if (!w.template_id) {
          toast.error('Choose a design to continue.')
          return false
        }
      }}
      continueLabel="Continue"
    >
      {upgradeAvailable && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-haldi-soft/50 px-5 py-4 ring-1 ring-haldi/50">
          <Sparkles className="size-5" aria-hidden />
          <p className="flex-1 text-sm">The {w.template?.name} design has been improved since you chose it. Your invitation won’t change unless you update.</p>
          <Button size="sm" variant="secondary" loading={upgrade.isPending} onClick={() => upgrade.mutate()}>
            Update to the latest version
          </Button>
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {templates.isLoading && Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-[18px]" />)}
        {templates.data?.map((t) => {
          const selected = t.id === w.template_id
          return (
            <article key={t.id} className={cn('overflow-hidden rounded-[20px] bg-white ring-1 transition', selected ? 'ring-2 ring-kumkum' : 'ring-rose/70')}>
              <button type="button" onClick={() => setPreviewing(t)} className="group relative block aspect-[4/5] w-full overflow-hidden bg-blush" aria-label={`Preview ${t.name}`}>
                {t.cover_image_url && <img src={t.cover_image_url.replace(/\.webp$/, '-sm.webp')} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />}
                <span className="absolute inset-0 grid place-items-center bg-plum/0 transition group-hover:bg-plum/40">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm opacity-0 transition group-hover:opacity-100">
                    <Eye className="size-4" aria-hidden /> Live demo
                  </span>
                </span>
                {selected && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-kumkum px-3 py-1 text-xs text-paper">
                    <Check className="size-3.5" aria-hidden /> Selected
                  </span>
                )}
              </button>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-2xl leading-tight">{t.name}</h2>
                  {t.category && <Badge>{t.category.name}</Badge>}
                </div>
                <p className="mt-1 text-sm text-mist">{t.tagline}</p>
                <p className="mt-2 text-xs text-mist">
                  {t.languages.map(languageName).join(' + ')} {t.cultural_tags.length > 0 && `— made for ${t.cultural_tags.slice(0, 2).join(', ')}`}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant={selected ? 'secondary' : 'primary'} disabled={selected} loading={choose.isPending && choose.variables?.id === t.id} onClick={() => choose.mutate(t)}>
                    {selected ? 'In use' : 'Use this design'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPreviewing(t)}>
                    Preview
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {current && palette && customizable && (
        <Panel className="mt-8" title="Colours" description={`Adjust the ${current.name} palette to match your outfits or décor.`} actions={<Button size="sm" variant="ghost" icon={<RotateCcw className="size-4" aria-hidden />} onClick={() => setOverrides({})}>Reset</Button>}>
          <div className="flex flex-wrap gap-8">
            {(['primary', 'accent', 'background', 'text'] as const).map((k) => (
              <ColorField key={k} label={{ primary: 'Main colour', accent: 'Highlight', background: 'Background', text: 'Text' }[k]} value={overrides[k] ?? palette[k]} onChange={(v) => setOverrides((o) => ({ ...o, [k]: v }))} />
            ))}
          </div>
          <Button className="mt-6" size="sm" onClick={() => saveColours.mutate()} loading={saveColours.isPending}>
            Save colours
          </Button>
        </Panel>
      )}
      <PreviewDialog t={previewing} onClose={() => setPreviewing(null)} onUse={() => previewing && choose.mutate(previewing)} using={choose.isPending} />
    </StepFrame>
  )
}
