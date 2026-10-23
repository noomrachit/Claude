import type { Database } from '@/lib/supabase/database.types'

type Tables = Database['public']['Tables']

export type Row<T extends keyof Tables> = Tables[T]['Row']
export type Insert<T extends keyof Tables> = Tables[T]['Insert']
export type Update<T extends keyof Tables> = Tables[T]['Update']

export type BoardRole = Database['public']['Enums']['board_role']

export type Profile = Row<'profiles'>
export type Board = Row<'boards'>
export type BoardMember = Row<'board_members'>
export type BoardInvitation = Row<'board_invitations'>
export type List = Row<'lists'>
export type Card = Row<'cards'>
export type Label = Row<'labels'>
export type CardLabel = Row<'card_labels'>
export type CardAssignee = Row<'card_assignees'>
export type ChecklistItem = Row<'checklist_items'>
export type Attachment = Row<'attachments'>
export type Comment = Row<'comments'>
