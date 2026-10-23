import { describe, expect, it } from 'vitest'
import { dateInputToIso, dueStatus, formatBytes, isoToDateInput } from './dates'

describe('dates', () => {
  it('round-trips a date input through ISO in local time', () => {
    const iso = dateInputToIso('2026-03-09')!
    expect(isoToDateInput(iso)).toBe('2026-03-09')
    expect(new Date(iso).getHours()).toBe(23)
  })
  it('handles empty / invalid input', () => {
    expect(dateInputToIso('')).toBeNull()
    expect(dateInputToIso('9/3/2026')).toBeNull()
    expect(isoToDateInput(null)).toBe('')
  })
  it('classifies due dates', () => {
    const now = new Date(2026, 2, 9, 10, 0)
    expect(dueStatus(new Date(2026, 2, 8, 12).toISOString(), now)).toBe('overdue')
    expect(dueStatus(dateInputToIso('2026-03-09')!, now)).toBe('today')
    expect(dueStatus(dateInputToIso('2026-03-12')!, now)).toBe('later')
  })
  it('formats byte sizes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})
