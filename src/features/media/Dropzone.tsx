import { UploadCloud } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  accept: string
  multiple?: boolean
  onFiles: (files: File[]) => void
  title: string
  hint: ReactNode
  disabled?: boolean
}

export function Dropzone({ accept, multiple, onFiles, title, hint, disabled }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        if (!disabled) onFiles([...e.dataTransfer.files])
      }}
      className={cn('flex flex-col items-center rounded-[20px] border-2 border-dashed px-6 py-10 text-center transition', over ? 'border-kumkum bg-blush' : 'border-rose bg-white/60', disabled && 'opacity-50')}
    >
      <UploadCloud className="size-9 text-kumkum" aria-hidden />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-mist">{hint}</p>
      <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="mt-5 inline-flex h-10 items-center rounded-full bg-plum px-5 text-sm text-paper hover:bg-plum-soft disabled:opacity-50">
        Choose files
      </button>
      <input
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          onFiles([...(e.target.files ?? [])])
          e.target.value = ''
        }}
      />
    </div>
  )
}

export interface UploadJob {
  id: string
  name: string
  progress: number
  error?: string
}

export function UploadQueue({ jobs }: { jobs: UploadJob[] }) {
  if (jobs.length === 0) return null
  return (
    <ul className="mt-4 space-y-2" aria-live="polite">
      {jobs.map((j) => (
        <li key={j.id} className="rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-rose">
          <div className="flex justify-between gap-3">
            <span className="truncate">{j.name}</span>
            {j.error ? <span className="shrink-0 text-danger">Failed</span> : <span className="shrink-0 text-mist tabular-nums">{Math.round(j.progress * 100)}%</span>}
          </div>
          {j.error ? (
            <p className="mt-1 text-danger">{j.error}</p>
          ) : (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-rose">
              <div className="h-full bg-kumkum transition-[width]" style={{ width: `${j.progress * 100}%` }} />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Runs uploads with limited concurrency and tracks per-file progress. */
export function useUploadQueue() {
  const [jobs, setJobs] = useState<UploadJob[]>([])
  const run = async (files: File[], worker: (f: File, progress: (p: number) => void) => Promise<void>, concurrency = 2) => {
    const items = files.map((f) => ({ id: crypto.randomUUID(), name: f.name, progress: 0, file: f }))
    setJobs((j) => [...j.filter((x) => x.error || x.progress < 1), ...items.map(({ file: _f, ...rest }) => rest)])
    let i = 0
    const next = async (): Promise<void> => {
      const item = items[i++]
      if (!item) return
      try {
        await worker(item.file, (p) => setJobs((j) => j.map((x) => (x.id === item.id ? { ...x, progress: p } : x))))
        setJobs((j) => j.filter((x) => x.id !== item.id))
      } catch (e) {
        setJobs((j) => j.map((x) => (x.id === item.id ? { ...x, error: (e as Error).message } : x)))
      }
      return next()
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next))
  }
  return { jobs, run, clearErrors: () => setJobs((j) => j.filter((x) => !x.error)) }
}
