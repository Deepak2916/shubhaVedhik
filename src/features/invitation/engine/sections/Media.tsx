import { Play } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { InvitationPhoto, InvitationVideo } from '@/lib/validation/invitation'
import { useInvitation } from '../context'
import { clipStyle, Perforations } from '../motifs/shapes'
import { Reveal, SectionShell, SectionTitle } from '../Section'
import type { SectionProps } from './Hero'

/** Responsive image: thumbnail for small slots, display size for large ones. */
export function Img({ photo, sizes, className, alt, eager }: { photo: InvitationPhoto; sizes: string; className?: string; alt?: string; eager?: boolean }) {
  const srcSet = photo.thumbUrl !== photo.url ? `${photo.thumbUrl} 640w, ${photo.url} 1600w` : undefined
  return (
    <img
      src={photo.thumbUrl || photo.url}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt ?? photo.caption ?? ''}
      width={photo.width ?? undefined}
      height={photo.height ?? undefined}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  )
}

// ---------------------------------------------------------------------------
export function StorySection({ id, config }: SectionProps) {
  const { messagesOf, t, data } = useInvitation()
  const chapters = [...messagesOf('story')].sort((a, b) => (a.meta?.date ?? '').localeCompare(b.meta?.date ?? ''))
  if (chapters.length === 0) return null
  const photoFor = (i: number, url?: string) => url ?? data.photos.filter((p) => p.kind === 'prewedding' || p.kind === 'engagement')[i]?.url

  if (config.variant === 'chapters') {
    return (
      <section id={`s-${id}`} aria-label="Our story" className="relative">
        <div className="px-6 pt-24 pb-10 text-center sm:px-12">
          <p className="text-xs tracking-[0.5em] text-inv-primary uppercase">{t(config.title)}</p>
        </div>
        {chapters.map((c, i) => {
          const img = photoFor(i, c.meta?.photoUrl)
          return (
            <article key={c.id} className="relative flex min-h-[90svh] items-end overflow-hidden">
              {img && <img src={img} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
              <Reveal className="relative w-full px-6 pb-[12vh] sm:px-12">
                <div className="max-w-2xl">
                  <p className="text-xs tracking-[0.4em] text-inv-primary uppercase">
                    Chapter {String(i + 1).padStart(2, '0')} {c.meta?.date && `· ${formatDate(c.meta.date, 'MMMM yyyy')}`}
                  </p>
                  {c.title && <h3 className="inv-display mt-3 text-[clamp(2rem,6vw,4rem)] leading-[0.95] text-white uppercase">{c.title.replace(/^Chapter \w+ — /i, '')}</h3>}
                  <p className="mt-4 text-lg leading-relaxed text-white/85">{t(c.body)}</p>
                </div>
              </Reveal>
            </article>
          )
        })}
      </section>
    )
  }

  return (
    <SectionShell id={id} config={config} label="Our story">
      <SectionTitle eyebrow={config.eyebrow} title={config.title} subtitle={config.subtitle} />
      <ol className="relative mx-auto max-w-4xl">
        <span className="absolute top-0 bottom-0 left-4 w-px bg-inv-primary/40 sm:left-1/2" aria-hidden />
        {chapters.map((c, i) => {
          const img = photoFor(i, c.meta?.photoUrl)
          const right = i % 2 === 1
          return (
            <Reveal as="li" key={c.id} className="relative mb-14 grid gap-6 pl-12 sm:grid-cols-2 sm:gap-14 sm:pl-0">
              <span className="absolute top-2 left-[11px] size-3 rounded-full bg-inv-primary ring-4 ring-inv-bg sm:left-1/2 sm:-ml-1.5" aria-hidden />
              <div className={cn(right ? 'sm:order-2' : 'sm:text-right')}>
                {c.meta?.date && <p className="text-sm tracking-[0.2em] text-inv-primary uppercase">{formatDate(c.meta.date, 'MMMM yyyy')}</p>}
                {c.title && <h3 className="inv-display mt-1 text-2xl sm:text-3xl">{c.title}</h3>}
                <p className="mt-3 leading-relaxed text-inv-muted">{t(c.body)}</p>
              </div>
              {img && (
                <div className={cn('aspect-[4/3] overflow-hidden rounded-t-[999px]', right && 'sm:order-1')}>
                  <img src={img} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                </div>
              )}
            </Reveal>
          )
        })}
      </ol>
    </SectionShell>
  )
}

// ---------------------------------------------------------------------------
export function GallerySection({ id, config }: SectionProps) {
  const { data, openLightbox, t } = useInvitation()
  const seen = new Set<string>()
  const photos = data.photos
    .filter((p) => (seen.has(p.url) ? false : (seen.add(p.url), true)))
    .slice(0, config.limit ?? 24)
  if (photos.length === 0) return null
  const open = (i: number) => openLightbox(photos, i)
  const variant = config.variant ?? 'masonry'

  if (variant === 'filmstrip') {
    return (
      <section id={`s-${id}`} aria-label="Photo gallery" className={cn('py-20 sm:py-28', config.background === 'surface' && 'bg-inv-surface')}>
        <p className="mb-10 px-6 text-center text-xs tracking-[0.5em] text-inv-primary uppercase">{t(config.title)}</p>
        <div className="bg-black py-3">
          <Perforations className="mx-2 h-2.5" />
          <div className="snap-row gap-3 px-3 py-3">
            {photos.map((p, i) => (
              <button key={p.id} type="button" onClick={() => open(i)} className="group relative h-[52vh] max-h-[420px] shrink-0 overflow-hidden" style={{ aspectRatio: `${p.width ?? 3}/${p.height ?? 4}` }} aria-label={`Open photo ${i + 1}`}>
                <Img photo={p} sizes="(max-width: 640px) 80vw, 420px" className="size-full object-cover transition duration-700 group-hover:scale-105" />
                <span className="absolute bottom-2 left-2 text-[0.6rem] tracking-[0.3em] text-white/70">{String(i + 1).padStart(3, '0')}</span>
              </button>
            ))}
          </div>
          <Perforations className="mx-2 h-2.5" />
        </div>
      </section>
    )
  }

  return (
    <SectionShell id={id} config={config} label="Photo gallery">
      <SectionTitle eyebrow={config.eyebrow} title={config.title} subtitle={config.subtitle} />
      {variant === 'masonry' && (
        <div className="columns-2 gap-3 sm:columns-3 sm:gap-4">
          {photos.map((p, i) => (
            <button key={p.id} type="button" onClick={() => open(i)} className="group mb-3 block w-full overflow-hidden sm:mb-4" aria-label={`Open photo ${i + 1}`}>
              <Img photo={p} sizes="(max-width: 640px) 50vw, 33vw" className="w-full transition duration-700 group-hover:scale-[1.04]" />
            </button>
          ))}
        </div>
      )}
      {variant === 'arched-grid' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
          {photos.map((p, i) => (
            <button key={p.id} type="button" onClick={() => open(i)} className="group relative aspect-[3/4]" aria-label={`Open photo ${i + 1}`}>
              <div className="absolute -inset-1.5 bg-inv-primary/50" style={clipStyle('mihrab')} />
              <div className="absolute inset-0 overflow-hidden" style={clipStyle('mihrab')}>
                <Img photo={p} sizes="(max-width: 640px) 50vw, 33vw" className="size-full object-cover transition duration-700 group-hover:scale-105" />
              </div>
            </button>
          ))}
        </div>
      )}
      {variant === 'editorial-grid' && (
        <div className="grid auto-rows-[38vw] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:grid-cols-4 sm:gap-4">
          {photos.map((p, i) => {
            const big = i % 5 === 0
            const tall = i % 5 === 3
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => open(i)}
                className={cn('group relative overflow-hidden', big && 'col-span-2 row-span-2', tall && 'row-span-2')}
                aria-label={`Open photo ${i + 1}`}
              >
                <Img photo={p} sizes={big ? '(max-width: 640px) 100vw, 50vw' : '(max-width: 640px) 50vw, 25vw'} className="size-full object-cover transition duration-700 group-hover:scale-105" />
                {p.caption && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-left text-xs text-white">{p.caption}</span>}
              </button>
            )
          })}
        </div>
      )}
      {variant === 'polaroid' && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4 sm:gap-x-8">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => open(i)}
              className="group bg-white p-2 pb-8 text-left shadow-[0_14px_30px_-14px_rgb(59_10_69/0.5)] transition hover:z-10 hover:rotate-0 hover:scale-105 sm:p-3 sm:pb-10"
              style={{ transform: `rotate(${[-3, 2, -1.5, 3, -2, 1][i % 6]}deg)` }}
              aria-label={`Open photo ${i + 1}`}
            >
              <div className="aspect-square overflow-hidden">
                <Img photo={p} sizes="(max-width: 640px) 50vw, 25vw" className="size-full object-cover" />
              </div>
              {p.caption && <p className="mt-2 truncate font-[cursive] text-sm text-[#3b0a45]">{p.caption}</p>}
            </button>
          ))}
        </div>
      )}
    </SectionShell>
  )
}

// ---------------------------------------------------------------------------
function VideoPlayer({ video, cinema }: { video: InvitationVideo; cinema?: boolean }) {
  const [playing, setPlaying] = useState(false)
  const ref = useRef<HTMLVideoElement>(null)
  const { track, pauseMusic } = useInvitation()
  const start = () => {
    pauseMusic()
    track('play_video')
    setPlaying(true)
    requestAnimationFrame(() => ref.current?.play().catch(() => undefined))
  }
  return (
    <figure>
      <div className={cn('relative aspect-video overflow-hidden bg-black', !cinema && 'rounded-[4px] ring-1 ring-inv-primary/40')}>
        {playing ? (
          <video ref={ref} src={video.url} poster={video.posterUrl ?? undefined} controls playsInline preload="none" className="size-full" onPlay={pauseMusic}>
            {video.title}
          </video>
        ) : (
          <button type="button" onClick={start} className="group absolute inset-0" aria-label={`Play ${video.title ?? 'video'}`}>
            {video.posterUrl && <img src={video.posterUrl} alt="" loading="lazy" decoding="async" className="size-full object-cover opacity-90 transition duration-700 group-hover:scale-105" />}
            <span className="absolute inset-0 bg-black/25" />
            <span className="absolute top-1/2 left-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-inv-primary text-inv-on-primary shadow-2xl transition group-hover:scale-110">
              <Play className="ml-1 size-8 fill-current" />
            </span>
            {video.durationS ? <span className="absolute right-3 bottom-3 rounded bg-black/60 px-2 py-0.5 text-xs text-white tabular-nums">{Math.floor(video.durationS / 60)}:{String(Math.round(video.durationS % 60)).padStart(2, '0')}</span> : null}
          </button>
        )}
      </div>
      {(video.title || video.description) && (
        <figcaption className={cn('mt-4', cinema && 'text-center')}>
          {video.title && <p className="inv-display text-xl">{video.title}</p>}
          {video.description && <p className="mt-1 text-sm text-inv-muted">{video.description}</p>}
        </figcaption>
      )}
    </figure>
  )
}

export function VideosSection({ id, config }: SectionProps) {
  const { data, t } = useInvitation()
  if (data.videos.length === 0) return null
  const cinema = config.variant === 'cinema'
  return (
    <SectionShell id={id} config={config} label="Pre-wedding videos" className={cn(cinema && 'bg-black')}>
      {cinema ? <p className="mb-10 text-center text-xs tracking-[0.5em] text-inv-primary uppercase">{t(config.title)}</p> : <SectionTitle eyebrow={config.eyebrow} title={config.title} subtitle={config.subtitle} />}
      <div className={cn('mx-auto grid gap-10', data.videos.length > 1 && !cinema ? 'max-w-6xl md:grid-cols-2' : 'max-w-5xl')}>
        {data.videos.map((v) => (
          <Reveal key={v.id}>
            <VideoPlayer video={v} cinema={cinema} />
          </Reveal>
        ))}
      </div>
    </SectionShell>
  )
}
