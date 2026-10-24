import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useOptimistic, type BoardContent } from '@/features/boards/boardContent'
import * as cardsApi from '@/features/cards/api'
import { byPosition } from '@/lib/position'
import * as api from './detailApi'

const nowIso = () => new Date().toISOString()

/** Optimistic mutations for everything inside the card detail that lives in the board cache. */
export function useCardDetailMutations(boardId: string, onError?: () => void) {
  const patch = (c: BoardContent, id: string, fields: Partial<BoardContent['cards'][number]>): BoardContent => ({
    ...c,
    cards: c.cards.map((x) => (x.id === id ? { ...x, ...fields } : x)),
  })

  return {
    renameCard: useOptimistic<{ id: string; title: string }>(
      boardId,
      ({ id, title }) => cardsApi.updateCard(id, { title }),
      (c, { id, title }) => patch(c, id, { title }),
      onError,
    ),
    setDescription: useOptimistic<{ id: string; description: string }>(
      boardId,
      ({ id, description }) => cardsApi.updateCard(id, { description }),
      (c, { id, description }) => patch(c, id, { description }),
      onError,
    ),
    setDueDate: useOptimistic<{ id: string; due_date: string | null }>(
      boardId,
      ({ id, due_date }) => cardsApi.updateCard(id, { due_date }),
      (c, { id, due_date }) => patch(c, id, { due_date }),
      onError,
    ),

    addLabel: useOptimistic<{ id: string; name: string; color: string }>(
      boardId,
      ({ id, name, color }) => api.insertLabel({ id, board_id: boardId, name, color }),
      (c, { id, name, color }) => ({ ...c, labels: [...c.labels, { id, board_id: boardId, name, color, created_at: nowIso() }] }),
      onError,
    ),
    updateLabel: useOptimistic<{ id: string; name: string; color: string }>(
      boardId,
      ({ id, name, color }) => api.updateLabel(id, { name, color }),
      (c, { id, name, color }) => ({ ...c, labels: c.labels.map((l) => (l.id === id ? { ...l, name, color } : l)) }),
      onError,
    ),
    deleteLabel: useOptimistic<{ id: string }>(
      boardId,
      ({ id }) => api.deleteLabel(id),
      (c, { id }) => ({ ...c, labels: c.labels.filter((l) => l.id !== id), cardLabels: c.cardLabels.filter((x) => x.label_id !== id) }),
      onError,
    ),
    toggleLabel: useOptimistic<{ cardId: string; labelId: string; on: boolean }>(
      boardId,
      ({ cardId, labelId, on }) => (on ? api.addCardLabel(boardId, cardId, labelId) : api.removeCardLabel(cardId, labelId)),
      (c, { cardId, labelId, on }) => ({
        ...c,
        cardLabels: on
          ? [...c.cardLabels, { card_id: cardId, label_id: labelId, board_id: boardId }]
          : c.cardLabels.filter((x) => !(x.card_id === cardId && x.label_id === labelId)),
      }),
      onError,
    ),

    toggleAssignee: useOptimistic<{ cardId: string; userId: string; on: boolean }>(
      boardId,
      ({ cardId, userId, on }) => (on ? api.addAssignee(boardId, cardId, userId) : api.removeAssignee(cardId, userId)),
      (c, { cardId, userId, on }) => ({
        ...c,
        cardAssignees: on
          ? [...c.cardAssignees, { card_id: cardId, user_id: userId, board_id: boardId }]
          : c.cardAssignees.filter((x) => !(x.card_id === cardId && x.user_id === userId)),
      }),
      onError,
    ),

    addChecklistItem: useOptimistic<{ id: string; cardId: string; content: string; position: string }>(
      boardId,
      ({ id, cardId, content, position }) => api.insertChecklistItem({ id, board_id: boardId, card_id: cardId, content, position }),
      (c, { id, cardId, content, position }) => ({
        ...c,
        checklistItems: [...c.checklistItems, { id, board_id: boardId, card_id: cardId, content, done: false, position, created_at: nowIso(), updated_at: nowIso() }],
      }),
      onError,
    ),
    toggleChecklistItem: useOptimistic<{ id: string; done: boolean }>(
      boardId,
      ({ id, done }) => api.setChecklistDone(id, done),
      (c, { id, done }) => ({ ...c, checklistItems: c.checklistItems.map((i) => (i.id === id ? { ...i, done } : i)) }),
      onError,
    ),
    renameChecklistItem: useOptimistic<{ id: string; content: string }>(
      boardId,
      ({ id, content }) => api.updateChecklistItem(id, { content }),
      (c, { id, content }) => ({ ...c, checklistItems: c.checklistItems.map((i) => (i.id === id ? { ...i, content } : i)) }),
      onError,
    ),
    moveChecklistItem: useOptimistic<{ id: string; position: string }>(
      boardId,
      ({ id, position }) => api.updateChecklistItem(id, { position }),
      (c, { id, position }) => ({
        ...c,
        checklistItems: c.checklistItems.map((i) => (i.id === id ? { ...i, position } : i)).sort(byPosition),
      }),
      onError,
    ),
    deleteChecklistItem: useOptimistic<{ id: string }>(
      boardId,
      ({ id }) => api.deleteChecklistItem(id),
      (c, { id }) => ({ ...c, checklistItems: c.checklistItems.filter((i) => i.id !== id) }),
      onError,
    ),
  }
}

// ---- per-card data that is not part of the board cache -----------------------

export function useAttachments(cardId: string) {
  const qc = useQueryClient()
  const key = ['attachments', cardId]
  const refresh = () => void qc.invalidateQueries({ queryKey: key })
  return {
    list: useQuery({ queryKey: key, queryFn: () => api.fetchAttachments(cardId) }),
    upload: useMutation({ mutationFn: ({ boardId, file }: { boardId: string; file: File }) => api.uploadAttachment(boardId, cardId, file), onSettled: refresh }),
    remove: useMutation({ mutationFn: ({ id, path }: { id: string; path: string }) => api.deleteAttachment(id, path), onSettled: refresh }),
  }
}

export function useComments(cardId: string) {
  const qc = useQueryClient()
  const key = ['comments', cardId]
  const refresh = () => void qc.invalidateQueries({ queryKey: key })
  return {
    list: useQuery({ queryKey: key, queryFn: () => api.fetchComments(cardId) }),
    add: useMutation({ mutationFn: ({ boardId, body }: { boardId: string; body: string }) => api.insertComment(boardId, cardId, body), onSettled: refresh }),
    remove: useMutation({ mutationFn: (id: string) => api.deleteComment(id), onSettled: refresh }),
  }
}
