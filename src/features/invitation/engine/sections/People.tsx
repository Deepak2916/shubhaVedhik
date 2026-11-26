import { cn } from '@/lib/cn'
import type { InvitationPhoto } from '@/lib/validation/invitation'
import { useInvitation } from '../context'
import { MOTIFS } from '../motifs'
import { clipStyle, FrameOutline } from '../motifs/shapes'
import { Reveal, SectionShell, SectionTitle } from '../Section'
import type { SectionProps } from './Hero'

type Shape = 'arch' | 'mihrab' | 'temple' | 'circle' | 'rect'

const shapeForMotif = (motif: string): Shape =>
  motif === 'temple' ? 'temple' : motif === 'geometric' ? 'mihrab' : motif === 'festive' ? 'circle' : motif === 'floral' ? 'arch' : 'rect'

function Portrait({ photo, alt, shape, className }: { photo?: InvitationPhoto; alt: string; shape: Shape; className?: string }) {
  const clip = shape === 'arch' || shape === 'mihrab' || shape === 'temple' ? clipStyle(shape) : undefined
  return (
    <div className={cn('relative', className)}>
      <div
        className={cn('size-full overflow-hidden bg-inv-surface', shape === 'circle' && 'rounded-full ring-4 ring-inv-accent ring-offset-4 ring-offset-inv-bg')}
        style={clip}
      >
        {photo && <img src={photo.url} alt={alt} loading="lazy" decoding="async" className="size-full object-cover" />}
      </div>
      {(shape === 'arch' || shape === 'mihrab' || shape === 'temple') && <FrameOutline shape={shape} />}
    </div>
  )
}

export function CoupleSection({ id, config }: SectionProps) {
  const { names, data, photosOf, config: tpl, t } = useInvitation()
  const bride = photosOf('bride')[0]
  const groom = photosOf('groom')[0]
  // Prefer a couple photo that isn't already the hero cover.
  const couples = [...photosOf('couple'), ...photosOf('engagement', 'prewedding')]
  const couple = couples.find((p) => p.url !== data.coverUrl) ?? couples[0]
  const variant = config.variant ?? 'side-by-side'
  const shape = variant === 'circle-portraits' ? 'circle' : variant === 'arch-portraits' ? (tpl.theme.motif === 'temple' ? 'temple' : 'arch') : shapeForMotif(tpl.theme.motif)
  const kit = MOTIFS[tpl.theme.motif]

  if (variant === 'credits') {
    return (
      <SectionShell id={id} config={config} label="The couple" className="text-center">
        <p className="text-xs tracking-[0.5em] text-inv-primary uppercase">{t(config.title)}</p>
        <div className="mt-12 grid gap-12 sm:grid-cols-2">
          {[
            { name: data.brideName, role: 'as the bride', photo: bride ?? photosOf('prewedding')[0] },
            { name: data.groomName, role: 'as the groom', photo: groom ?? photosOf('engagement', 'couple')[1] ?? couple },
          ].map((p, i) => (
            <Reveal key={p.name} delay={i * 0.15}>
              {p.photo && (
                <div className="mx-auto aspect-[3/4] max-w-xs overflow-hidden grayscale-[40%]">
                  <img src={p.photo.url} alt={p.name} loading="lazy" className="size-full object-cover" />
                </div>
              )}
              <p className="inv-display mt-6 text-[clamp(2rem,5vw,3rem)] leading-none uppercase">{p.name}</p>
              <p className="mt-2 text-sm text-inv-muted italic">{p.role}</p>
            </Reveal>
          ))}
        </div>
        {data.coupleIntro && <p className="mx-auto mt-14 max-w-2xl text-lg leading-relaxed text-inv-muted">{t(data.coupleIntro)}</p>}
      </SectionShell>
    )
  }

  if (variant === 'editorial-columns') {
    return (
      <SectionShell id={id} config={config} label="The couple">
        <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_1fr]">
          {couple && (
            <Reveal className="aspect-[4/5] overflow-hidden">
              <img src={couple.url} alt={`${names.bride} and ${names.groom}`} loading="lazy" className="size-full object-cover" />
            </Reveal>
          )}
          <div>
            <p className="text-xs tracking-[0.4em] text-inv-muted uppercase">{t(config.title)}</p>
            <div className="mt-8 grid grid-cols-2 gap-8 border-t border-inv-text/20 pt-6">
              {[
                ['The bride', data.brideName, data.brideParents],
                ['The groom', data.groomName, data.groomParents],
              ].map(([role, name, parents]) => (
                <div key={role}>
                  <p className="text-xs tracking-[0.3em] text-inv-muted uppercase">{role}</p>
                  <p className="inv-display mt-3 text-3xl leading-none uppercase">{name}</p>
                  {parents && <p className="mt-3 text-sm text-inv-muted">{parents}</p>}
                </div>
              ))}
            </div>
            {data.coupleIntro && <p className="mt-10 text-lg leading-relaxed">{t(data.coupleIntro)}</p>}
          </div>
        </div>
      </SectionShell>
    )
  }

  const both = bride && groom
  return (
    <SectionShell id={id} config={config} label="The couple">
      <SectionTitle eyebrow={config.eyebrow} title={config.title} subtitle={config.subtitle} />
      {both ? (
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-5 sm:gap-14">
          {[
            { p: bride, name: data.brideName, local: names.brideLocal, parents: data.brideParents, role: 'Daughter of' },
            { p: groom, name: data.groomName, local: names.groomLocal, parents: data.groomParents, role: 'Son of' },
          ].map((x, i) => (
            <Reveal key={x.name} delay={i * 0.12} className="text-center">
              <Portrait photo={x.p} alt={x.name} shape={shape} className={cn('mx-auto', shape === 'circle' ? 'aspect-square w-[86%]' : 'aspect-[3/4] w-full')} />
              <h3 className="inv-display inv-display-cased mt-6 text-[clamp(1.4rem,3.4vw,2.2rem)]">{x.name}</h3>
              {x.local && <p className="inv-accent-font text-lg text-inv-muted">{x.local}</p>}
              {x.parents && (
                <p className="mt-2 text-sm leading-snug text-inv-muted">
                  {x.role} {x.parents}
                </p>
              )}
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mx-auto grid max-w-5xl items-center gap-8 sm:grid-cols-[1fr_auto_1fr]">
          <Reveal className="order-2 text-center sm:order-1 sm:text-right">
            <h3 className="inv-display inv-display-cased text-[clamp(1.8rem,4vw,2.6rem)]">{data.brideName}</h3>
            {names.brideLocal && <p className="inv-accent-font text-lg text-inv-muted">{names.brideLocal}</p>}
            {data.brideParents && <p className="mt-2 text-sm text-inv-muted">Daughter of {data.brideParents}</p>}
          </Reveal>
          <Reveal className="order-1 mx-auto sm:order-2">
            <Portrait
              photo={couple ?? bride ?? groom}
              alt={`${names.bride} and ${names.groom}`}
              shape={shape}
              className={shape === 'circle' ? 'size-64 sm:size-72' : 'aspect-[3/4] w-64 sm:w-80'}
            />
          </Reveal>
          <Reveal className="order-3 text-center sm:text-left">
            <h3 className="inv-display inv-display-cased text-[clamp(1.8rem,4vw,2.6rem)]">{data.groomName}</h3>
            {names.groomLocal && <p className="inv-accent-font text-lg text-inv-muted">{names.groomLocal}</p>}
            {data.groomParents && <p className="mt-2 text-sm text-inv-muted">Son of {data.groomParents}</p>}
          </Reveal>
        </div>
      )}
      {data.coupleIntro && (
        <Reveal className="mx-auto mt-14 max-w-2xl text-center">
          {kit.Divider({ className: 'mb-6' })}
          <p className="text-lg leading-relaxed">{t(data.coupleIntro)}</p>
        </Reveal>
      )}
    </SectionShell>
  )
}

export function PersonSection({ id, config, who }: SectionProps & { who: 'bride' | 'groom' }) {
  const { data, names, photosOf, config: tpl, t } = useInvitation()
  const photo = photosOf(who)[0]
  const name = who === 'bride' ? data.brideName : data.groomName
  const local = who === 'bride' ? names.brideLocal : names.groomLocal
  const parents = who === 'bride' ? data.brideParents : data.groomParents
  if (!name) return null
  const shape = shapeForMotif(tpl.theme.motif)
  const reverse = config.variant === 'portrait-right'
  const full = config.variant === 'portrait-full'
  return (
    <SectionShell id={id} config={config} label={who === 'bride' ? 'The bride' : 'The groom'}>
      <div className={cn('mx-auto grid max-w-5xl items-center gap-10', !full && 'sm:grid-cols-2')}>
        {photo && (
          <Reveal className={cn(reverse && 'sm:order-2', full && 'mx-auto w-full max-w-md')}>
            <Portrait photo={photo} alt={name} shape={shape} className={shape === 'circle' ? 'mx-auto aspect-square w-4/5' : 'aspect-[3/4] w-full'} />
          </Reveal>
        )}
        <Reveal className={cn('text-center', !full && 'sm:text-left')}>
          <p className="text-xs tracking-[0.3em] text-inv-muted uppercase">{t(config.eyebrow) || (who === 'bride' ? 'The bride' : 'The groom')}</p>
          <h2 className="inv-display inv-display-cased mt-3 text-[clamp(2.2rem,6vw,3.8rem)] leading-none">{name}</h2>
          {local && <p className="inv-accent-font mt-2 text-xl text-inv-muted">{local}</p>}
          {parents && (
            <p className="mt-4 text-inv-muted">
              {who === 'bride' ? 'Daughter of' : 'Son of'} {parents}
            </p>
          )}
          {config.body && <p className="mt-6 text-lg leading-relaxed">{t(config.body)}</p>}
        </Reveal>
      </div>
    </SectionShell>
  )
}
