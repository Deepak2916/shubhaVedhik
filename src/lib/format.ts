import { differenceInSeconds, format, isValid, parseISO } from 'date-fns'

export function parseDate(date?: string | null): Date | null {
  if (!date) return null
  const d = parseISO(date)
  return isValid(d) ? d : null
}

export function formatDate(date?: string | null, pattern = 'EEEE, d MMMM yyyy'): string {
  const d = parseDate(date)
  return d ? format(d, pattern) : ''
}

/** '10:42' → '10:42 AM' */
export function formatTime(time?: string | null): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h)) return time
  const d = new Date(2000, 0, 1, h, m || 0)
  return format(d, 'h:mm a')
}

export function formatTimeRange(start?: string | null, end?: string | null): string {
  if (start && end) return `${formatTime(start)} – ${formatTime(end)}`
  return formatTime(start ?? end)
}

export function combineDateTime(date?: string | null, time?: string | null): Date | null {
  const d = parseDate(date)
  if (!d) return null
  if (time) {
    const [h, m] = time.split(':').map(Number)
    d.setHours(h || 0, m || 0, 0, 0)
  }
  return d
}

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  past: boolean
}

export function countdownTo(target: Date, now = new Date()): CountdownParts {
  let s = differenceInSeconds(target, now)
  const past = s <= 0
  s = Math.max(0, s)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    past,
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function initials(a: string, b: string): string {
  return `${a.trim().charAt(0)}${b.trim().charAt(0)}`.toUpperCase()
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}
