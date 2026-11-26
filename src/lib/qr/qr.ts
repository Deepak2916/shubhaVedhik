/**
 * QR downloads. The QR itself is rendered by qrcode.react; these helpers turn
 * the rendered elements into files: a plain SVG (for printers) and a shareable
 * PNG card with the couple's names (for WhatsApp).
 */

function download(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function downloadSvg(svg: SVGSVGElement, filename: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  download(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

interface CardOptions {
  qrCanvas: HTMLCanvasElement
  title: string
  subtitle: string
  footer: string
  filename: string
}

/** 1080×1350 portrait card — fits WhatsApp/Instagram previews without cropping. */
export async function downloadQrCard({ qrCanvas, title, subtitle, footer, filename }: CardOptions) {
  await document.fonts.ready
  const W = 1080
  const H = 1350
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#FCF5F3'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#E7A626'
  ctx.lineWidth = 4
  ctx.strokeRect(40, 40, W - 80, H - 80)
  ctx.strokeStyle = '#9E1B3C'
  ctx.lineWidth = 1.5
  ctx.strokeRect(56, 56, W - 112, H - 112)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#9E1B3C'
  ctx.font = '500 34px Mukta, sans-serif'
  ctx.fillText('You are invited', W / 2, 170)
  ctx.fillStyle = '#2B1730'
  let size = 84
  ctx.font = `${size}px "Rozha One", Georgia, serif`
  while (ctx.measureText(title).width > W - 200 && size > 40) {
    size -= 4
    ctx.font = `${size}px "Rozha One", Georgia, serif`
  }
  ctx.fillText(title, W / 2, 280)
  ctx.fillStyle = '#6F5866'
  ctx.font = '36px Mukta, sans-serif'
  ctx.fillText(subtitle, W / 2, 345)

  const q = 560
  const x = (W - q) / 2
  const y = 420
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(x - 30, y - 30, q + 60, q + 60)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(qrCanvas, x, y, q, q)

  ctx.fillStyle = '#2B1730'
  ctx.font = '600 38px Mukta, sans-serif'
  ctx.fillText('Scan to open the invitation', W / 2, y + q + 110)
  ctx.fillStyle = '#6F5866'
  ctx.font = '30px Mukta, sans-serif'
  ctx.fillText(footer, W / 2, y + q + 160)
  download(c.toDataURL('image/png'), filename)
}
