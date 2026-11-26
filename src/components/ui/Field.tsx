import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const control =
  'w-full rounded-[10px] bg-white px-3.5 text-plum ring-1 ring-rose placeholder:text-mist/60 transition focus:outline-none focus:ring-2 focus:ring-kumkum/50 aria-[invalid=true]:ring-danger/60 disabled:bg-blush/40'

interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string
  optional?: boolean
  children: (id: string, describedBy: string | undefined) => ReactNode
  className?: string
}

export function Field({ label, hint, error, optional, children, className }: FieldProps) {
  const id = useId()
  const descId = hint || error ? `${id}-desc` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-plum">
        {label}
        {optional && <span className="ml-1.5 font-normal text-mist">optional</span>}
      </label>
      {children(id, descId)}
      {(error || hint) && (
        <p id={descId} className={cn('text-[0.8rem] leading-snug', error ? 'text-danger' : 'text-mist')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(control, 'h-11', className)} {...rest} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, rows = 4, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(control, 'py-2.5 leading-relaxed', className)} {...rest} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn(control, 'h-11 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 stroke=%27%236f5866%27 fill=%27none%27 stroke-width=%271.5%27/%3E%3C/svg%3E")] bg-[position:right_14px_center] bg-no-repeat pr-9', className)} {...rest}>
      {children}
    </select>
  )
})

interface SwitchProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <label className={cn('flex items-start gap-3', disabled && 'opacity-50')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-leaf' : 'bg-rose')}
      >
        <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
      </button>
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="text-[0.8rem] text-mist">{description}</span>}
      </span>
    </label>
  )
}

interface ChipsProps {
  options: readonly { value: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
  multiple?: boolean
  label?: string
}

export function Chips({ options, value, onChange, multiple = true, label }: ChipsProps) {
  return (
    <div role={multiple ? 'group' : 'radiogroup'} aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={on}
            onClick={() => onChange(multiple ? (on ? value.filter((v) => v !== o.value) : [...value, o.value]) : [o.value])}
            className={cn(
              'h-9 rounded-full px-4 text-sm ring-1 transition',
              on ? 'bg-plum text-paper ring-plum' : 'bg-white text-plum ring-rose hover:ring-plum/40',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId()
  return (
    <div className="flex items-center gap-3">
      <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="size-10 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
      <label htmlFor={id} className="flex flex-col text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-mono text-xs text-mist">{value}</span>
      </label>
    </div>
  )
}
