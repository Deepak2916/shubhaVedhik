import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastApi {
  success: (m: string) => void
  error: (m: string) => void
  info: (m: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x.slice(-3), { id, kind, message }])
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), kind === 'error' ? 6000 : 3500)
  }, [])
  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push('success', m), error: (m) => push('error', m), info: (m) => push('info', m) }),
    [push],
  )
  const icons = { success: CheckCircle2, error: AlertCircle, info: Info }
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {items.map((t) => {
            const Icon = icons[t.kind]
            return (
              <m.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                role={t.kind === 'error' ? 'alert' : 'status'}
                className="pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl bg-plum px-4 py-3 text-sm text-paper shadow-lift"
              >
                <Icon className={t.kind === 'error' ? 'mt-0.5 size-4 shrink-0 text-[#ff9b8f]' : 'mt-0.5 size-4 shrink-0 text-haldi'} aria-hidden />
                <span>{t.message}</span>
              </m.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
