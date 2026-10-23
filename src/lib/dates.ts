const pad = (n: number) => String(n).padStart(2, '0')

/** ISO timestamp -> `YYYY-MM-DD` in the user's local time zone (for <input type="date">). */
export function isoToDateInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** `YYYY-MM-DD` -> ISO timestamp for the end of that local day (cards are due "by" a date). */
export function dateInputToIso(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 0).toISOString()
}

export type DueStatus = 'overdue' | 'today' | 'later'

export function dueStatus(iso: string, now: Date = new Date()): DueStatus {
  const due = new Date(iso)
  if (due.getTime() < now.getTime()) return 'overdue'
  return isoToDateInput(iso) === isoToDateInput(now.toISOString()) ? 'today' : 'later'
}

export function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
