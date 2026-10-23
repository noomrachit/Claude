import { describe, expect, it } from 'vitest'
import { safeFileName } from './detailApi'

describe('safeFileName', () => {
  it('keeps ASCII names and replaces everything else', () => {
    expect(safeFileName('report-v2.pdf')).toBe('report-v2.pdf')
    expect(safeFileName('รายงาน 1.pdf')).toBe('_1.pdf')
    expect(safeFileName('../../etc/passwd')).toBe('.._.._etc_passwd')
  })
  it('never returns an empty name and caps the length', () => {
    expect(safeFileName('')).toBe('file')
    expect(safeFileName('a'.repeat(200)).length).toBe(80)
  })
})
