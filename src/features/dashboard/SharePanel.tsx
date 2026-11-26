import { Check, Copy, Download, ExternalLink, Share2 } from 'lucide-react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Primitives'
import { useToast } from '@/components/ui/Toast'
import { invitationUrl } from '@/lib/env'
import { formatDate } from '@/lib/format'
import { downloadQrCard, downloadSvg } from '@/lib/qr/qr'
import type { WeddingRow } from '@/types/db'

export function SharePanel({ w }: { w: WeddingRow }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const url = invitationUrl(w.slug)
  const qrUrl = `${url}?src=qr`
  const live = w.status === 'published'
  const title = `${w.bride_name} & ${w.groom_name}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Couldn’t copy — select the link and copy it manually.')
    }
  }
  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${title} — wedding invitation`, text: `You're invited to the wedding of ${title}!`, url }).catch(() => undefined)
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`You're invited to the wedding of ${title}! ${url}`)}`, '_blank', 'noopener')
    }
  }

  return (
    <Panel title="Share your invitation" description={live ? 'Anyone with the link or QR code can open it — no sign-in needed.' : 'Publish first. The link and QR code are ready and won’t change.'}>
      <div className="grid gap-8 md:grid-cols-[auto_1fr]">
        <div className="mx-auto w-fit rounded-2xl bg-white p-4 ring-1 ring-rose">
          <QRCodeSVG ref={svgRef} value={qrUrl} size={176} level="M" fgColor="#2B1730" marginSize={2} title={`QR code for ${url}`} />
          <QRCodeCanvas ref={canvasRef} value={qrUrl} size={1024} level="M" fgColor="#2B1730" marginSize={2} className="hidden" aria-hidden />
        </div>
        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-paper px-4 py-3 ring-1 ring-rose">
            <span className="min-w-0 flex-1 truncate font-medium select-all">{url}</span>
            <button type="button" onClick={copy} className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-blush" aria-label="Copy link">
              {copied ? <Check className="size-4 text-leaf" /> : <Copy className="size-4" />}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={<Share2 className="size-4" aria-hidden />} onClick={share} disabled={!live}>
              Share
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="size-4" aria-hidden />}
              onClick={() => canvasRef.current && downloadQrCard({ qrCanvas: canvasRef.current, title, subtitle: [formatDate(w.wedding_date, 'd MMMM yyyy'), w.city].filter(Boolean).join(' · '), footer: url.replace(/^https?:\/\//, ''), filename: `${w.slug}-qr-card.png` })}
            >
              QR card (PNG)
            </Button>
            <Button variant="secondary" size="sm" icon={<Download className="size-4" aria-hidden />} onClick={() => svgRef.current && downloadSvg(svgRef.current, `${w.slug}-qr.svg`)}>
              QR for print (SVG)
            </Button>
            {live && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm text-kumkum hover:bg-blush">
                <ExternalLink className="size-4" aria-hidden /> Open
              </a>
            )}
          </div>
          <p className="text-sm text-mist">Scans of the QR code are counted separately from link opens, so you can see whether guests used the printed card or WhatsApp.</p>
        </div>
      </div>
    </Panel>
  )
}
