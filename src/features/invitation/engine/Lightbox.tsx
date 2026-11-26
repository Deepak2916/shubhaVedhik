import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { AnimatePresence, m, type PanInfo } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import type { InvitationPhoto } from '@/lib/validation/invitation'

interface Props {
  photos: InvitationPhoto[]
  index: number
  onClose: () => void
}

export default function Lightbox({ photos, index: start, onClose }: Props) {
  const [[index, dir], setState] = useState<[number, number]>([start, 0])
  const go = useCallback((d: number) => setState(([i]) => [(i + d + photos.length) % photos.length, d]), [photos.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [go, onClose])

  // Preload neighbours so swiping feels instant.
  useEffect(() => {
    ;[1, -1].forEach((d) => {
      const p = photos[(index + d + photos.length) % photos.length]
      if (p) new Image().src = p.url
    })
  }, [index, photos])

  const photo = photos[index]
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(1)
    else if (info.offset.x > 60 || info.velocity.x > 400) go(-1)
    else if (info.offset.y > 120) onClose()
  }

  return (
    <m.div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button type="button" onClick={onClose} aria-label="Close" className="absolute top-4 right-4 z-10 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
        <X className="size-5" />
      </button>
      <p className="absolute top-6 left-6 text-sm text-white/70 tabular-nums">
        {index + 1} / {photos.length}
      </p>
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <m.figure
          key={photo.id + index}
          custom={dir}
          initial={{ opacity: 0, x: dir * 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -80 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          drag
          dragSnapToOrigin
          dragElastic={0.6}
          onDragEnd={onDragEnd}
          className="flex max-h-full max-w-full touch-none flex-col items-center px-2"
        >
          <img src={photo.url} alt={photo.caption ?? ''} className="max-h-[84svh] max-w-[96vw] object-contain select-none" draggable={false} />
          {photo.caption && <figcaption className="mt-3 text-center text-sm text-white/80">{photo.caption}</figcaption>}
        </m.figure>
      </AnimatePresence>
      {photos.length > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-3 hidden size-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:grid">
            <ChevronLeft className="size-6" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next photo" className="absolute right-3 hidden size-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:grid">
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
    </m.div>
  )
}
