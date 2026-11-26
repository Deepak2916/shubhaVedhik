import { useEffect, useState } from 'react'
import { invitationDataSchema, type InvitationData } from '@/lib/validation/invitation'
import { sectionDefSchema, templateConfigSchema } from '@/lib/validation/template'
import type { TemplateModel } from './engine/context'
import { InvitationRenderer } from './engine/InvitationRenderer'
import { InvitationLoading } from './Unavailable'

export const PREVIEW_MESSAGE = 'sv-live-preview'

export interface LivePreviewMessage {
  type: typeof PREVIEW_MESSAGE
  template: TemplateModel
  data: InvitationData
  skipOpening?: boolean
  scrollTo?: string
}

/**
 * Renders whatever the parent window posts (same origin only). Used by the
 * admin template builder and the wedding wizard so previews update instantly
 * and use the real mobile/desktop breakpoints of an iframe.
 */
export default function LivePreviewPage() {
  const [state, setState] = useState<{ template: TemplateModel; data: InvitationData; skip: boolean; error?: string } | null>(null)

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || (e.data as { type?: string })?.type !== PREVIEW_MESSAGE) return
      const msg = e.data as LivePreviewMessage
      const config = templateConfigSchema.safeParse(msg.template.config)
      const data = invitationDataSchema.safeParse(msg.data)
      if (!config.success || !data.success) {
        setState((s) => (s ? { ...s, error: 'Fix the highlighted settings to update the preview.' } : s))
        return
      }
      const sections = msg.template.sections.flatMap((s) => {
        const r = sectionDefSchema.safeParse(s)
        return r.success ? [r.data] : []
      })
      setState({ template: { ...msg.template, config: config.data, sections }, data: data.data, skip: Boolean(msg.skipOpening) })
      if (msg.scrollTo) requestAnimationFrame(() => document.getElementById(`s-${msg.scrollTo}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
    window.addEventListener('message', onMessage)
    window.parent?.postMessage({ type: 'sv-preview-ready' }, window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  if (!state) return <InvitationLoading />
  return (
    <>
      <InvitationRenderer key={state.skip ? 'skip' : 'opening'} template={state.template} data={state.data} mode="embed" skipOpening={state.skip} />
      {state.error && <div className="fixed inset-x-3 top-3 z-[80] rounded-xl bg-[#b42318] px-4 py-2 text-sm text-white">{state.error}</div>}
    </>
  )
}
