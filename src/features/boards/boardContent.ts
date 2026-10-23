import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/useAuth'
import * as cardsApi from '@/features/cards/api'
import * as listsApi from '@/features/lists/api'
import { byPosition, positionBetween } from '@/lib/position'
import { queryKeys } from '@/lib/queryKeys'
import { supabase } from '@/lib/supabase/client'
import type { Card, CardAssignee, CardLabel, ChecklistItem, Label, List } from '@/types'

export interface BoardContent {
  lists: List[]
  cards: Card[]
  labels: Label[]
  cardLabels: CardLabel[]
  cardAssignees: CardAssignee[]
  checklistItems: ChecklistItem[]
}

/** Drops the given cards and everything that hangs off them. */
export function withoutCards(c: BoardContent, cardIds: Set<string>): BoardContent {
  return {
    ...c,
    cards: c.cards.filter((x) => !cardIds.has(x.id)),
    cardLabels: c.cardLabels.filter((x) => !cardIds.has(x.card_id)),
    cardAssignees: c.cardAssignees.filter((x) => !cardIds.has(x.card_id)),
    checklistItems: c.checklistItems.filter((x) => !cardIds.has(x.card_id)),
  }
}

async function fetchBoardContent(boardId: string): Promise<BoardContent> {
  const [lists, cards, labels, cardLabels, cardAssignees, checklistItems] = await Promise.all([
    supabase.from('lists').select('*').eq('board_id', boardId).order('position'),
    supabase.from('cards').select('*').eq('board_id', boardId).is('archived_at', null).order('position'),
    supabase.from('labels').select('*').eq('board_id', boardId).order('created_at'),
    supabase.from('card_labels').select('*').eq('board_id', boardId),
    supabase.from('card_assignees').select('*').eq('board_id', boardId),
    supabase.from('checklist_items').select('*').eq('board_id', boardId).order('position'),
  ])
  for (const r of [lists, cards, labels, cardLabels, cardAssignees, checklistItems]) if (r.error) throw r.error
  return {
    lists: lists.data!.sort(byPosition),
    cards: cards.data!.sort(byPosition),
    labels: labels.data!,
    cardLabels: cardLabels.data!,
    cardAssignees: cardAssignees.data!,
    checklistItems: checklistItems.data!.sort(byPosition),
  }
}

export function useBoardContent(boardId: string) {
  return useQuery({ queryKey: queryKeys.content(boardId), queryFn: () => fetchBoardContent(boardId) })
}

const nowIso = () => new Date().toISOString()

/**
 * A mutation that updates the cached board content immediately, restores the
 * previous snapshot if the request fails, and refetches when settled.
 */
export function useOptimistic<V>(
  boardId: string,
  mutationFn: (vars: V) => Promise<void>,
  apply: (content: BoardContent, vars: V) => BoardContent,
  onError?: () => void,
) {
  const qc = useQueryClient()
  const key = queryKeys.content(boardId)
  return useMutation({
    mutationFn,
    onMutate: async (vars: V) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<BoardContent>(key)
      if (previous) qc.setQueryData<BoardContent>(key, apply(previous, vars))
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous)
      onError?.()
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: key }),
  })
}

/** Position key for a new item appended after `items` (sorted by position). */
export const positionAfter = (items: { position: string }[]) => positionBetween(items.at(-1)?.position ?? null, null)

/** All list/card mutations for one board. `onError` fires after a failed mutation has been rolled back. */
export function useBoardMutations(boardId: string, onError?: () => void) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return {
    addList: useOptimistic<{ id: string; title: string; position: string }>(
      boardId,
      ({ id, title, position }) => listsApi.insertList({ id, board_id: boardId, title, position }),
      (c, { id, title, position }) => ({
        ...c,
        lists: [...c.lists, { id, board_id: boardId, title, position, created_at: nowIso(), updated_at: nowIso() }],
      }),
      onError,
    ),
    renameList: useOptimistic<{ id: string; title: string }>(
      boardId,
      ({ id, title }) => listsApi.updateList(id, { title }),
      (c, { id, title }) => ({ ...c, lists: c.lists.map((l) => (l.id === id ? { ...l, title } : l)) }),
      onError,
    ),
    moveList: useOptimistic<{ id: string; position: string }>(
      boardId,
      ({ id, position }) => listsApi.updateList(id, { position }),
      (c, { id, position }) => ({ ...c, lists: c.lists.map((l) => (l.id === id ? { ...l, position } : l)).sort(byPosition) }),
      onError,
    ),
    deleteList: useOptimistic<{ id: string }>(
      boardId,
      ({ id }) => listsApi.deleteList(id),
      (c, { id }) => ({
        ...withoutCards(c, new Set(c.cards.filter((card) => card.list_id === id).map((card) => card.id))),
        lists: c.lists.filter((l) => l.id !== id),
      }),
      onError,
    ),
    addCard: useOptimistic<{ id: string; listId: string; title: string; position: string }>(
      boardId,
      ({ id, listId, title, position }) => cardsApi.insertCard({ id, board_id: boardId, list_id: listId, title, position }),
      (c, { id, listId, title, position }) => {
        const card: Card = {
          id, board_id: boardId, list_id: listId, title, description: '', due_date: null, position,
          archived_at: null, created_by: userId, created_at: nowIso(), updated_at: nowIso(),
        }
        return { ...c, cards: [...c.cards, card] }
      },
      onError,
    ),
    renameCard: useOptimistic<{ id: string; title: string }>(
      boardId,
      ({ id, title }) => cardsApi.updateCard(id, { title }),
      (c, { id, title }) => ({ ...c, cards: c.cards.map((x) => (x.id === id ? { ...x, title } : x)) }),
      onError,
    ),
    moveCard: useOptimistic<{ id: string; listId: string; position: string }>(
      boardId,
      ({ id, listId, position }) => cardsApi.updateCard(id, { list_id: listId, position }),
      (c, { id, listId, position }) => ({
        ...c,
        cards: c.cards.map((x) => (x.id === id ? { ...x, list_id: listId, position } : x)).sort(byPosition),
      }),
      onError,
    ),
    deleteCard: useOptimistic<{ id: string }>(
      boardId,
      ({ id }) => cardsApi.deleteCard(id),
      (c, { id }) => withoutCards(c, new Set([id])),
      onError,
    ),
  }
}
