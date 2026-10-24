import { supabase } from '@/lib/supabase/client'
import type { Insert } from '@/types'

// ---- labels -----------------------------------------------------------------
export async function insertLabel(label: Insert<'labels'>) {
  const { error } = await supabase.from('labels').insert(label)
  if (error) throw error
}
export async function updateLabel(id: string, patch: { name: string; color: string }) {
  const { error } = await supabase.from('labels').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteLabel(id: string) {
  const { error } = await supabase.from('labels').delete().eq('id', id)
  if (error) throw error
}
export async function addCardLabel(boardId: string, cardId: string, labelId: string) {
  const { error } = await supabase.from('card_labels').insert({ board_id: boardId, card_id: cardId, label_id: labelId })
  if (error) throw error
}
export async function removeCardLabel(cardId: string, labelId: string) {
  const { error } = await supabase.from('card_labels').delete().eq('card_id', cardId).eq('label_id', labelId)
  if (error) throw error
}

// ---- assignees --------------------------------------------------------------
export async function addAssignee(boardId: string, cardId: string, userId: string) {
  const { error } = await supabase.from('card_assignees').insert({ board_id: boardId, card_id: cardId, user_id: userId })
  if (error) throw error
}
export async function removeAssignee(cardId: string, userId: string) {
  const { error } = await supabase.from('card_assignees').delete().eq('card_id', cardId).eq('user_id', userId)
  if (error) throw error
}

// ---- checklist --------------------------------------------------------------
export async function insertChecklistItem(item: Insert<'checklist_items'>) {
  const { error } = await supabase.from('checklist_items').insert(item)
  if (error) throw error
}
export async function setChecklistDone(id: string, done: boolean) {
  const { error } = await supabase.from('checklist_items').update({ done }).eq('id', id)
  if (error) throw error
}
export async function updateChecklistItem(id: string, patch: { content?: string; position?: string }) {
  const { error } = await supabase.from('checklist_items').update(patch).eq('id', id)
  if (error) throw error
}
export async function deleteChecklistItem(id: string) {
  const { error } = await supabase.from('checklist_items').delete().eq('id', id)
  if (error) throw error
}

// ---- attachments (rows + Storage objects) ------------------------------------
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const BUCKET = 'attachments'

export async function fetchAttachments(cardId: string) {
  const { data, error } = await supabase.from('attachments').select('*').eq('card_id', cardId).order('created_at')
  if (error) throw error
  return data
}

/** Storage keys stay ASCII; the original name is kept in the row. */
export const safeFileName = (name: string) => name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80) || 'file'

export async function uploadAttachment(boardId: string, cardId: string, file: File) {
  const storagePath = `${boardId}/${cardId}/${crypto.randomUUID()}-${safeFileName(file.name)}`
  const up = await supabase.storage.from(BUCKET).upload(storagePath, file, { contentType: file.type || undefined })
  if (up.error) throw up.error
  const { error } = await supabase.from('attachments').insert({
    board_id: boardId,
    card_id: cardId,
    storage_path: storagePath,
    file_name: file.name,
    size_bytes: file.size,
    mime_type: file.type || null,
  })
  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw error
  }
}

export async function deleteAttachment(id: string, storagePath: string) {
  const { error } = await supabase.from('attachments').delete().eq('id', id)
  if (error) throw error
  await supabase.storage.from(BUCKET).remove([storagePath]) // best effort: the row is already gone
}

export async function signedAttachmentUrl(storagePath: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60)
  if (error) throw error
  return data.signedUrl
}

// ---- comments ---------------------------------------------------------------
export async function fetchComments(cardId: string) {
  const { data, error } = await supabase.from('comments').select('*').eq('card_id', cardId).order('created_at')
  if (error) throw error
  return data
}
export async function insertComment(boardId: string, cardId: string, body: string) {
  const { error } = await supabase.from('comments').insert({ board_id: boardId, card_id: cardId, body })
  if (error) throw error
}
export async function deleteComment(id: string) {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}
