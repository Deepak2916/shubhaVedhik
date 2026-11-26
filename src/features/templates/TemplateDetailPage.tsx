import { useQuery } from '@tanstack/react-query'
import { Check, Maximize2, Monitor, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ButtonLink } from '@/components/ui/Button'
import { Badge, PageLoader } from '@/components/ui/Primitives'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { cn } from '@/lib/cn'
import { languageName } from '@/lib/languages'
import NotFoundPage from '../marketing/NotFoundPage'
import { getTemplateBySlug } from './api'

export default function TemplateDetailPage() {
  const { slug = '' } = useParams()
  const { user } = useAuth()
  const q = useQuery({ queryKey: ['template', slug], queryFn: () => getTemplateBySlug(slug) })
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile')
  useDocumentMeta({ title: q.data ? `${q.data.name} — ${q.data.tagline} · ShubhaVedhik` : 'Template · ShubhaVedhik', description: q.data?.description ?? undefined, image: q.data?.cover_image_url })
  if (q.isLoading) return <PageLoader />
  if (!q.data) return <NotFoundPage />
  const t = q.data
  const useHref = user ? `/dashboard?new=1&template=${t.slug}` : `/register?template=${t.slug}`
  return (
    <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:py-16">
      <div className="lg:sticky lg:top-28 lg:self-start">
        {t.category && <Badge tone="gold">{t.category.name}</Badge>}
        <h1 className="mt-4 font-display text-[clamp(2.8rem,6vw,4.6rem)] leading-none">{t.name}</h1>
        <p className="mt-3 text-xl text-plum-soft">{t.tagline}</p>
        <p className="mt-6 max-w-lg leading-relaxed text-mist">{t.description}</p>
        <ul className="mt-8 space-y-2.5 text-[0.95rem]">
          {[
            `Languages: ${t.languages.map(languageName).join(', ')} — add any other`,
            t.supports_music && 'Background music with play, mute and volume',
            t.supports_video && 'Cinema-style pre-wedding video',
            t.supports_gallery && 'Photo gallery with full-screen swipe viewer',
            'Unlimited events, directions and add-to-calendar',
            'QR code and share link for unlimited guests',
          ]
            .filter(Boolean)
            .map((f) => (
              <li key={String(f)} className="flex items-start gap-2.5">
                <Check className="mt-1 size-4 shrink-0 text-leaf" aria-hidden /> {f}
              </li>
            ))}
        </ul>
        {t.cultural_tags.length > 0 && (
          <p className="mt-6 text-sm text-mist">
            Designed with {t.cultural_tags.slice(0, 4).join(', ')} weddings in mind — and fully editable for yours.
          </p>
        )}
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink to={useHref} size="lg">
            Use this design
          </ButtonLink>
          <ButtonLink to={`/preview/${t.slug}`} variant="secondary" size="lg" icon={<Maximize2 className="size-4" aria-hidden />}>
            Full-screen demo
          </ButtonLink>
        </div>
      </div>
      <div>
        <div className="mb-4 inline-flex rounded-full bg-blush p-1" role="radiogroup" aria-label="Preview device">
          {(['mobile', 'desktop'] as const).map((d) => (
            <button key={d} type="button" role="radio" aria-checked={device === d} onClick={() => setDevice(d)} className={cn('inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm', device === d ? 'bg-white shadow-card' : 'text-mist')}>
              {d === 'mobile' ? <Smartphone className="size-4" aria-hidden /> : <Monitor className="size-4" aria-hidden />}
              {d === 'mobile' ? 'Mobile' : 'Desktop'}
            </button>
          ))}
        </div>
        {device === 'mobile' ? (
          <div className="mx-auto w-[min(100%,390px)] rounded-[46px] bg-plum p-3 shadow-lift">
            <div className="overflow-hidden rounded-[36px] bg-black" style={{ aspectRatio: '390/800' }}>
              <iframe title={`${t.name} mobile preview`} src={`/preview/${t.slug}?embed=1`} className="size-full border-0" loading="lazy" />
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[14px] bg-plum shadow-lift">
            <div className="flex gap-1.5 px-4 py-3" aria-hidden>
              <span className="size-2.5 rounded-full bg-paper/30" />
              <span className="size-2.5 rounded-full bg-paper/30" />
              <span className="size-2.5 rounded-full bg-paper/30" />
            </div>
            <div className="relative aspect-[16/10] overflow-hidden bg-black">
              <iframe title={`${t.name} desktop preview`} src={`/preview/${t.slug}?embed=1`} className="absolute top-0 left-0 h-[200%] w-[200%] origin-top-left scale-50 border-0" loading="lazy" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
