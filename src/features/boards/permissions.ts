import type { BoardRole } from '@/types'

export const canEdit = (role: BoardRole | null | undefined) => role === 'owner' || role === 'editor'
export const isOwner = (role: BoardRole | null | undefined) => role === 'owner'
