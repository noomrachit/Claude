import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/features/auth/useAuth'
import type { BoardRole } from '@/types'
import * as api from './api'
import type { BoardWithRole } from './boardsSelectors'

function useUserId() {
  const { user } = useAuth()
  if (!user) throw new Error('Board hooks require a signed-in user')
  return user.id
}

export function useBoards() {
  const userId = useUserId()
  return useQuery({ queryKey: queryKeys.boards(userId), queryFn: () => api.fetchBoards(userId) })
}

export function useBoard(boardId: string) {
  const userId = useUserId()
  return useQuery({ queryKey: queryKeys.board(userId, boardId), queryFn: () => api.fetchBoard(userId, boardId) })
}

/**
 * Optimistically rewrites the boards list, rolls back on error and refetches when settled.
 */
function useOptimisticBoardsMutation<V>(
  mutationFn: (vars: V) => Promise<void>,
  apply: (boards: BoardWithRole[], vars: V, userId: string) => BoardWithRole[],
) {
  const userId = useUserId()
  const qc = useQueryClient()
  const key = queryKeys.boards(userId)
  return useMutation({
    mutationFn,
    onMutate: async (vars: V) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<BoardWithRole[]>(key)
      if (previous) qc.setQueryData(key, apply(previous, vars, userId))
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['boards'] })
      void qc.invalidateQueries({ queryKey: ['board'] })
    },
  })
}

const patchBoard = (boards: BoardWithRole[], id: string, patch: Partial<BoardWithRole>) =>
  boards.map((b) => (b.id === id ? { ...b, ...patch, updated_at: new Date().toISOString() } : b))

export function useCreateBoard() {
  return useOptimisticBoardsMutation<{ id: string; title: string }>(
    ({ id, title }) => api.createBoard(id, title),
    (boards, { id, title }, userId) => {
      const now = new Date().toISOString()
      return [{ id, title, owner_id: userId, archived_at: null, created_at: now, updated_at: now, role: 'owner' }, ...boards]
    },
  )
}

export function useRenameBoard() {
  return useOptimisticBoardsMutation<{ id: string; title: string }>(
    ({ id, title }) => api.updateBoard(id, { title }),
    (boards, { id, title }) => patchBoard(boards, id, { title }),
  )
}

export function useArchiveBoard() {
  return useOptimisticBoardsMutation<{ id: string; archived: boolean }>(
    ({ id, archived }) => api.updateBoard(id, { archived_at: archived ? new Date().toISOString() : null }),
    (boards, { id, archived }) => patchBoard(boards, id, { archived_at: archived ? new Date().toISOString() : null }),
  )
}

export function useDeleteBoard() {
  return useOptimisticBoardsMutation<{ id: string }>(
    ({ id }) => api.deleteBoard(id),
    (boards, { id }) => boards.filter((b) => b.id !== id),
  )
}

export function useMembers(boardId: string) {
  return useQuery({ queryKey: queryKeys.members(boardId), queryFn: () => api.fetchMembers(boardId) })
}

export function useInvitations(boardId: string, enabled: boolean) {
  return useQuery({ queryKey: queryKeys.invitations(boardId), queryFn: () => api.fetchInvitations(boardId), enabled })
}

export function useMemberMutations(boardId: string) {
  const qc = useQueryClient()
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.members(boardId) })
    void qc.invalidateQueries({ queryKey: queryKeys.invitations(boardId) })
  }
  return {
    invite: useMutation({
      mutationFn: ({ email, role }: { email: string; role: BoardRole }) => api.inviteToBoard(boardId, email, role),
      onSettled: refresh,
    }),
    setRole: useMutation({
      mutationFn: ({ userId, role }: { userId: string; role: BoardRole }) => api.setMemberRole(boardId, userId, role),
      onSettled: refresh,
    }),
    remove: useMutation({ mutationFn: (userId: string) => api.removeMember(boardId, userId), onSettled: refresh }),
    cancelInvite: useMutation({ mutationFn: (id: string) => api.cancelInvitation(id), onSettled: refresh }),
  }
}
