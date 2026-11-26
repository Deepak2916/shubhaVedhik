import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { useWizard } from './context'

interface Props {
  title: string
  description?: string
  children: ReactNode
  /** Called by the primary button; return false to stay on the step. */
  onContinue?: () => Promise<boolean | void> | boolean | void
  continueLabel?: string
  saving?: boolean
  hideBack?: boolean
  aside?: ReactNode
}

export function StepFrame({ title, description, children, onContinue, continueLabel = 'Save & continue', saving, hideBack, aside }: Props) {
  const { next, back } = useWizard()
  const go = async () => {
    const ok = onContinue ? await onContinue() : true
    if (ok !== false) next()
  }
  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 id="step-title" className="font-display text-[clamp(1.9rem,4vw,2.6rem)] leading-tight">{title}</h1>
          {description && <p className="mt-2 text-mist">{description}</p>}
        </div>
        {aside}
      </header>
      {children}
      <footer className="sticky bottom-0 z-10 -mx-4 mt-10 flex items-center justify-between gap-3 border-t border-rose/80 bg-paper/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
        {!hideBack ? (
          <Button variant="ghost" onClick={back} icon={<ArrowLeft className="size-4" aria-hidden />}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button onClick={() => void go()} loading={saving}>
          {continueLabel} <ArrowRight className="size-4" aria-hidden />
        </Button>
      </footer>
    </div>
  )
}
