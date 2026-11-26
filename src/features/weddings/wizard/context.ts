import { createContext, useContext } from 'react'
import type { WeddingListItem } from '../api'

export interface WizardContextValue {
  wedding: WeddingListItem
  refresh: () => Promise<void>
  next: () => void
  back: () => void
}

export const WizardContext = createContext<WizardContextValue | null>(null)

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used inside WeddingWizard')
  return ctx
}

export const STEPS = [
  { key: 'details', label: 'Basic details' },
  { key: 'culture', label: 'Culture & languages' },
  { key: 'template', label: 'Design' },
  { key: 'photos', label: 'Photos' },
  { key: 'videos', label: 'Videos' },
  { key: 'music', label: 'Music' },
  { key: 'events', label: 'Events' },
  { key: 'messages', label: 'Messages' },
  { key: 'preview', label: 'Preview & publish' },
] as const

export type StepKey = (typeof STEPS)[number]['key']
