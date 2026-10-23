import { describe, expect, it } from 'vitest'
import { canEdit, isOwner } from './permissions'

describe('permissions', () => {
  it('owner and editor can edit, viewer and unknown cannot', () => {
    expect(canEdit('owner')).toBe(true)
    expect(canEdit('editor')).toBe(true)
    expect(canEdit('viewer')).toBe(false)
    expect(canEdit(null)).toBe(false)
  })
  it('only owner is owner', () => {
    expect(isOwner('owner')).toBe(true)
    expect(isOwner('editor')).toBe(false)
  })
})
