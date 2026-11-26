import { Monitor, RotateCcw, Smartphone } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { TemplateModel } from '@/features/invitation/engine/context'
import { PREVIEW_MESSAGE, type LivePreviewMessage } from '@/features/invitation/LivePreviewPage'
import { cn } from '@/lib/cn'
import type { InvitationData } from '@/lib/validation/invitation'

type Device = 'mobile' | 'desktop'
const SIZES: Record<Device, { w: number; h: number }> = { mobile: { w: 390, h: 844 }, desktop: { w: 1280, h: 800 } }

interface Props {
  template: TemplateModel
  data: InvitationData
  scrollTo?: string
  className?: string
  initialDevice?: Device
  /** Opening scene on by default; toggled from the toolbar. */
  showOpening?: boolean
}

/**
 * Same-origin iframe running /preview/live. Renders at the real device width
 * (so responsive breakpoints are true) and scales down to fit the container.
 */
export function LivePreviewFrame({ template, data, scrollTo, className, initialDevice = 'mobile', showOpening = false }: Props) {
  const frame = useRef<HTMLIFrameElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [device, setDevice] = useState<Device>(initialDevice)
  const [ready, setReady] = useState(false)
  const [opening, setOpening] = useState(showOpening)
  const [scale, setScale] = useState(0.5)
  const size = SIZES[device]

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setScale(Math.min(1, width / size.w, height > 100 ? height / size.h : Infinity))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [size.w, size.h])

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin === window.location.origin && (e.data as { type?: string })?.type === 'sv-preview-ready' && e.source === frame.current?.contentWindow) setReady(true)
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => {
      const msg: LivePreviewMessage = { type: PREVIEW_MESSAGE, template, data, skipOpening: !opening, scrollTo }
      frame.current?.contentWindow?.postMessage(msg, window.location.origin)
    }, 200)
    return () => clearTimeout(t)
  }, [ready, template, data, opening, scrollTo])

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex rounded-full bg-blush p-1" role="radiogroup" aria-label="Preview device">
          {(['mobile', 'desktop'] as const).map((d) => (
            <button key={d} type="button" role="radio" aria-checked={device === d} onClick={() => setDevice(d)} className={cn('inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm', device === d ? 'bg-white shadow-card' : 'text-mist')}>
              {d === 'mobile' ? <Smartphone className="size-4" aria-hidden /> : <Monitor className="size-4" aria-hidden />}
              {d === 'mobile' ? 'Mobile' : 'Desktop'}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setOpening((o) => !o)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm text-mist hover:bg-blush" aria-pressed={opening}>
          <RotateCcw className="size-4" aria-hidden /> {opening ? 'Skip opening' : 'Replay opening'}
        </button>
      </div>
      <div ref={box} className="relative min-h-[420px] flex-1 overflow-hidden rounded-[18px] bg-plum/5">
        <div
          className="absolute top-0 left-1/2 origin-top overflow-hidden rounded-[14px] bg-white shadow-lift ring-1 ring-plum/10"
          style={{ width: size.w, height: size.h, transform: `translateX(-50%) scale(${scale})` }}
        >
          <iframe ref={frame} title="Invitation preview" src="/preview/live" className="size-full border-0" />
        </div>
      </div>
    </div>
  )
}
