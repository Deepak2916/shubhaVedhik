import { createContext, useContext } from 'react'
import type { InvitationData, InvitationMessage, InvitationPhoto } from '@/lib/validation/invitation'
import type { MessageKind, SectionDef, TemplateConfig } from '@/lib/validation/template'

export type RenderMode = 'live' | 'preview' | 'embed'
export type GuestAction = 'open_invitation' | 'play_music' | 'play_video' | 'open_map' | 'view_gallery' | 'share'

export interface TemplateModel {
  slug: string
  name: string
  config: TemplateConfig
  sections: SectionDef[]
}

export interface InvitationContextValue {
  data: InvitationData
  config: TemplateConfig
  mode: RenderMode
  lang: string
  setLang: (l: string) => void
  /** Replaces {{bride}} {{groom}} {{date}} {{time}} {{city}} {{venue}} */
  t: (text?: string | null) => string
  /**
   * Like t(), but hides faith-specific invocations (Bismillah, Ganesha vandana,
   * shlokas) when the couple's chosen religion is a different one. Template
   * aesthetics are not religious rules.
   */
  sacred: (text?: string | null) => string
  names: { bride: string; groom: string; brideLocal?: string; groomLocal?: string; headline?: string }
  photosOf: (...kinds: InvitationPhoto['kind'][]) => InvitationPhoto[]
  messagesOf: (kind: MessageKind) => InvitationMessage[]
  invitationMessage: string
  track: (action: GuestAction) => void
  openLightbox: (photos: InvitationPhoto[], index: number) => void
  pauseMusic: () => void
}

export const InvitationContext = createContext<InvitationContextValue | null>(null)

export function useInvitation(): InvitationContextValue {
  const ctx = useContext(InvitationContext)
  if (!ctx) throw new Error('useInvitation must be used inside InvitationRenderer')
  return ctx
}
