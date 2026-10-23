import { supabase } from '@/lib/supabase/client'
import type { BoardRole } from '@/types'
import type { BoardWithRole } from './boardsSelectors'

export async function fetchBoards(userId: string): Promise<BoardWithRole[]> {
  const { data, error } = await supabase
    .from('board_members')
    .select('role, boards(*)')
    .eq('user_id', userId)
  if (error) throw error
  return data.flatMap((row) => (row.boards ? [{ ...row.boards, role: row.role }] : []))
}

/** Resolves to null when the board does not exist or the user is not a member (RLS hides it). */
export async function fetchBoard(userId: string, boardId: string): Promise<BoardWithRole | null> {
  const { data, error } = await supabase
    .from('board_members')
    .select('role, boards(*)')
    .eq('user_id', userId)
    .eq('board_id', boardId)
    .maybeSingle()
  if (error) throw error
  return data?.boards ? { ...data.boards, role: data.role } : null
}

export async function createBoard(id: string, title: string) {
  const { error } = await supabase.from('boards').insert({ id, title })
  if (error) throw error
}

export async function updateBoard(id: string, patch: { title?: string; archived_at?: string | null }) {
  const { error } = await supabase.from('boards').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteBoard(id: string) {
  const { error } = await supabase.from('boards').delete().eq('id', id)
  if (error) throw error
}

export async function fetchMembers(boardId: string) {
  const { data, error } = await supabase
    .from('board_members')
    .select('user_id, role, created_at, profiles(id, email, display_name, avatar_url)')
    .eq('board_id', boardId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function fetchInvitations(boardId: string) {
  const { data, error } = await supabase
    .from('board_invitations')
    .select('id, email, role, created_at')
    .eq('board_id', boardId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function inviteToBoard(boardId: string, email: string, role: BoardRole) {
  const { data, error } = await supabase.rpc('invite_to_board', { p_board_id: boardId, p_email: email, p_role: role })
  if (error) throw error
  return data as 'added' | 'invited' | 'already_member'
}

export async function setMemberRole(boardId: string, userId: string, role: BoardRole) {
  const { error } = await supabase.from('board_members').update({ role }).eq('board_id', boardId).eq('user_id', userId)
  if (error) throw error
}

export async function removeMember(boardId: string, userId: string) {
  const { error } = await supabase.from('board_members').delete().eq('board_id', boardId).eq('user_id', userId)
  if (error) throw error
}

export async function cancelInvitation(id: string) {
  const { error } = await supabase.from('board_invitations').delete().eq('id', id)
  if (error) throw error
}
