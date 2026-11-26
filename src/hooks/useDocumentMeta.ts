import { useEffect } from 'react'

interface Meta {
  title: string
  description?: string
  image?: string | null
  canonical?: string
  noindex?: boolean
}

function setMeta(attr: 'name' | 'property', key: string, value: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!value) return
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = value
}

/** Client-side head updates. Crawlers get server-injected tags for /w/:slug (see netlify/edge-functions). */
export function useDocumentMeta({ title, description, image, canonical, noindex }: Meta) {
  useEffect(() => {
    document.title = title
    setMeta('property', 'og:title', title)
    setMeta('name', 'description', description)
    setMeta('property', 'og:description', description)
    if (image) setMeta('property', 'og:image', new URL(image, window.location.origin).toString())
    setMeta('name', 'robots', noindex ? 'noindex' : undefined)
    if (canonical) {
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = canonical
    }
  }, [title, description, image, canonical, noindex])
}
