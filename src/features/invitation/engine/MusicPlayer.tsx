import type { Howl } from 'howler'
import { Music, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

export interface MusicHandle {
  play: () => void
  pause: () => void
}

interface Props {
  src: string
  title?: string | null
  initialVolume: number
  onPlay?: () => void
}

/**
 * Background music. Howler is imported lazily on the first play so it never
 * weighs down the first paint, and playback only ever starts from a user
 * gesture (browser autoplay rules).
 */
export const MusicPlayer = forwardRef<MusicHandle, Props>(function MusicPlayer({ src, title, initialVolume, onPlay }, ref) {
  const howl = useRef<Howl | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(initialVolume)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState(false)

  const ensure = useCallback(async () => {
    if (howl.current) return howl.current
    const { Howl } = await import('howler')
    const h = new Howl({
      src: [src],
      html5: true,
      loop: true,
      volume: 0,
      onplay: () => setPlaying(true),
      onpause: () => setPlaying(false),
      onstop: () => setPlaying(false),
      onloaderror: () => setError(true),
      onplayerror: () => {
        setPlaying(false)
        h.once('unlock', () => h.play())
      },
    })
    howl.current = h
    return h
  }, [src])

  const play = useCallback(async () => {
    const h = await ensure()
    h.play()
    h.fade(0, muted ? 0 : volume, 1800)
    onPlay?.()
  }, [ensure, muted, volume, onPlay])

  const pause = useCallback(() => {
    howl.current?.pause()
  }, [])

  useImperativeHandle(ref, () => ({ play: () => void play(), pause }), [play, pause])

  useEffect(() => {
    howl.current?.volume(muted ? 0 : volume)
  }, [volume, muted])

  useEffect(
    () => () => {
      howl.current?.unload()
      howl.current = null
    },
    [],
  )

  // Pause when the tab is hidden; guests often switch back to WhatsApp.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) howl.current?.pause()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  if (error) return null

  return (
    <div className="fixed right-4 bottom-4 z-40 flex items-center gap-1 rounded-full bg-inv-bg/85 p-1.5 text-inv-text shadow-[0_10px_30px_-12px_rgb(0_0_0/0.5)] ring-1 ring-inv-primary/40 backdrop-blur-md" style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}>
      <button
        type="button"
        onClick={() => (playing ? pause() : void play())}
        aria-label={playing ? 'Pause music' : 'Play music'}
        className="relative grid size-11 place-items-center rounded-full bg-inv-primary text-inv-on-primary"
      >
        {playing ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
        {playing && <span className="absolute -inset-1 animate-ping rounded-full border border-inv-primary/50 [animation-duration:3s]" aria-hidden />}
      </button>
      <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted} className="grid size-11 place-items-center rounded-full hover:bg-inv-primary/15">
        {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <m.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex items-center gap-3 overflow-hidden pr-2">
            <label className="flex items-center gap-2 text-inv-primary">
              <span className="sr-only">Volume</span>
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="range-thin w-24" />
            </label>
            {title && <span className="max-w-32 truncate text-xs text-inv-muted">{title}</span>}
          </m.div>
        )}
      </AnimatePresence>
      <button type="button" onClick={() => setExpanded((x) => !x)} aria-label={expanded ? 'Hide volume' : 'Show volume'} aria-expanded={expanded} className={cn('grid size-11 place-items-center rounded-full hover:bg-inv-primary/15', expanded && 'text-inv-primary')}>
        <Music className="size-4" />
      </button>
    </div>
  )
})
