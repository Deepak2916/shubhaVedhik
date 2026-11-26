import { Film, Music2, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { languageName } from '@/lib/languages'
import type { CatalogTemplate } from './api'

export function TemplateCard({ t, className, action }: { t: CatalogTemplate; className?: string; action?: React.ReactNode }) {
  return (
    <article className={cn('group flex flex-col', className)}>
      <Link to={`/templates/${t.slug}`} className="relative block aspect-[3/4] overflow-hidden rounded-[18px] bg-blush" aria-label={`${t.name} — view details`}>
        {t.cover_image_url && (
          <img src={t.cover_image_url.replace(/\.webp$/, '-sm.webp')} alt="" loading="lazy" decoding="async" className="size-full object-cover transition duration-[1.2s] ease-[var(--ease-silk)] group-hover:scale-105" onError={(e) => ((e.currentTarget.src = t.cover_image_url ?? ''))} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-plum/85 via-plum/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-paper">
          {t.category && <p className="text-xs text-haldi">{t.category.name}</p>}
          <h3 className="mt-1 font-display text-3xl leading-none">{t.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-paper/80">{t.tagline}</p>
        </div>
        <span className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition group-hover:opacity-100" aria-hidden>
          <Play className="ml-0.5 size-4 fill-current" />
        </span>
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-xs text-mist">
        <span>{t.languages.map(languageName).join(' + ')}</span>
        {t.supports_music && (
          <span className="inline-flex items-center gap-1">
            <Music2 className="size-3" aria-hidden /> Music
          </span>
        )}
        {t.supports_video && (
          <span className="inline-flex items-center gap-1">
            <Film className="size-3" aria-hidden /> Video
          </span>
        )}
        {action && <span className="ml-auto">{action}</span>}
      </div>
    </article>
  )
}
