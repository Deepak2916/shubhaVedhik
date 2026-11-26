import { Languages } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { formatDate, formatTime } from '@/lib/format'
import { LANGUAGES } from '@/lib/languages'
import type { InvitationData, InvitationPhoto } from '@/lib/validation/invitation'
import type { MessageKind } from '@/lib/validation/template'
import { InvitationContext, type GuestAction, type InvitationContextValue, type RenderMode, type TemplateModel } from './context'
import { ClipDefs } from './motifs/shapes'
import { MusicPlayer, type MusicHandle } from './MusicPlayer'
import { OPENINGS } from './openings/Openings'
import { SECTION_COMPONENTS } from './registry'
import { interpolate, prepareFonts, resolvePalette, themeStyle } from './theme'

const Lightbox = lazy(() => import('./Lightbox'))

interface Props {
  template: TemplateModel
  data: InvitationData
  mode: RenderMode
  /** Skip the opening scene (builder previews, thumbnails). */
  skipOpening?: boolean
  onTrack?: (action: GuestAction) => void
}

const SCRIPT_RELIGION: [RegExp, string[]][] = [
  [/[؀-ۿ]/, ['muslim', 'interfaith']], // Arabic script invocations
  [/॥|श्री गणेश|శ్రీ|ஸ்ரீ|ಶ್ರೀ/, ['hindu', 'jain', 'interfaith']], // shlokas / vandana
]

export function InvitationRenderer({ template, data, mode, skipOpening, onTrack }: Props) {
  const { config, sections } = template
  const [opened, setOpened] = useState(Boolean(skipOpening))
  const [lang, setLang] = useState(data.primaryLanguage || 'en')
  const [lightbox, setLightbox] = useState<{ photos: InvitationPhoto[]; index: number } | null>(null)
  const music = useRef<MusicHandle>(null)

  const regional = useMemo(() => prepareFonts(config, [...data.languages, lang]), [config, data.languages, lang])
  const palette = resolvePalette(config, data.themeOverrides)
  const style = themeStyle(config, palette, regional)

  const localKey = lang !== 'en' ? lang : (data.languages.find((l) => l !== 'en') ?? '')
  const local = useMemo(() => data.localized[localKey] ?? {}, [data.localized, localKey])
  const showLocalMain = lang !== 'en' && Boolean(local.brideName)

  const track = useCallback((a: GuestAction) => onTrack?.(a), [onTrack])

  const ctx = useMemo<InvitationContextValue>(() => {
    const vars = {
      bride: data.brideName,
      groom: data.groomName,
      date: formatDate(data.date),
      time: formatTime(data.time),
      city: data.city ?? '',
      venue: data.venueName ?? '',
    }
    const t = (text?: string | null) => interpolate(text, vars)
    const sacred = (text?: string | null) => {
      const value = t(text)
      if (!value || !data.religion) return value
      for (const [re, faiths] of SCRIPT_RELIGION) {
        if (re.test(value) && !faiths.includes(data.religion)) return ''
      }
      return value
    }
    const messagesOf = (kind: MessageKind) => {
      const all = data.messages.filter((m) => m.kind === kind)
      const inLang = all.filter((m) => m.language === lang)
      return inLang.length ? inLang : all.filter((m) => m.language === 'en').length ? all.filter((m) => m.language === 'en') : all
    }
    const invitationMessage =
      (lang !== 'en' && local.invitationMessage) || messagesOf('invitation')[0]?.body || data.invitationMessage || ''
    return {
      data,
      config,
      mode,
      lang,
      setLang,
      t,
      sacred,
      names: {
        bride: showLocalMain ? (local.brideName ?? data.brideName) : data.brideName,
        groom: showLocalMain ? (local.groomName ?? data.groomName) : data.groomName,
        brideLocal: showLocalMain ? data.brideName : local.brideName,
        groomLocal: showLocalMain ? data.groomName : local.groomName,
        headline: local.headline,
      },
      photosOf: (...kinds) => data.photos.filter((p) => kinds.includes(p.kind)),
      messagesOf,
      invitationMessage: t(invitationMessage),
      track,
      openLightbox: (photos, index) => {
        track('view_gallery')
        setLightbox({ photos, index })
      },
      pauseMusic: () => music.current?.pause(),
    }
  }, [data, config, mode, lang, local, showLocalMain, track])

  const audio = config.music.enabled && data.musicSettings.enabled !== false ? (data.audio ?? (config.music.defaultTrackUrl ? { url: config.music.defaultTrackUrl, title: config.music.defaultTrackTitle } : null)) : null

  const open = () => {
    setOpened(true)
    window.scrollTo({ top: 0 })
    track('open_invitation')
    if (audio && data.musicSettings.autoplay && data.musicSettings.startOn === 'open') music.current?.play()
  }

  // Lock page scroll while the opening scene is showing.
  useEffect(() => {
    if (opened || mode === 'embed') return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prev
    }
  }, [opened, mode])

  const Opening = OPENINGS[config.opening.style]
  const languages = data.languages.filter((l, i, a) => a.indexOf(l) === i)
  const texture = config.theme.texture

  return (
    <InvitationContext.Provider value={ctx}>
      <div
        className={cn('inv-root relative min-h-[100svh]', texture === 'paper' && 'tex-paper', texture === 'linen' && 'tex-linen', texture === 'grain' && 'tex-grain')}
        style={style}
        data-heading-case={config.theme.headingCase}
        lang={lang}
      >
        <ClipDefs />
        <AnimatePresence>
          {!opened && (
            <m.div key="opening" exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="relative z-50">
              <Opening onOpen={open} />
            </m.div>
          )}
        </AnimatePresence>

        <main aria-hidden={!opened || undefined} className={cn(!opened && 'pointer-events-none')}>
          {sections
            .filter((s) => s.enabled)
            .map((s) => {
              const Comp = SECTION_COMPONENTS[s.type]
              return Comp ? <Comp key={s.key} id={s.key} config={s.config} /> : null
            })}
          <footer className="px-6 py-10 text-center text-xs text-inv-muted">
            <a href="/" className="hover:text-inv-primary">
              Made with ShubhaVedhik
            </a>
          </footer>
        </main>

        {opened && languages.length > 1 && (
          <button
            type="button"
            onClick={() => setLang(languages[(languages.indexOf(lang) + 1) % languages.length])}
            className="fixed top-4 right-4 z-40 inline-flex h-10 items-center gap-2 rounded-full bg-inv-bg/85 px-4 text-sm text-inv-text shadow-lg ring-1 ring-inv-primary/40 backdrop-blur-md"
            aria-label="Change language"
          >
            <Languages className="size-4 text-inv-primary" aria-hidden />
            {LANGUAGES.find((l) => l.code === languages[(languages.indexOf(lang) + 1) % languages.length])?.native}
          </button>
        )}

        {audio && (opened || mode !== 'embed') && (
          <div className={cn('transition-opacity duration-500', opened ? 'opacity-100' : 'pointer-events-none opacity-0')}>
            <MusicPlayer ref={music} src={audio.url} title={audio.title} initialVolume={data.musicSettings.volume ?? config.music.volume} onPlay={() => track('play_music')} />
          </div>
        )}

        <AnimatePresence>
          {lightbox && (
            <Suspense fallback={null}>
              <Lightbox photos={lightbox.photos} index={lightbox.index} onClose={() => setLightbox(null)} />
            </Suspense>
          )}
        </AnimatePresence>
      </div>
    </InvitationContext.Provider>
  )
}
