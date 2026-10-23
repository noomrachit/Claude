import { supabase } from '@/lib/supabase/client'
import type { Insert, Update } from '@/types'

export async function insertCard(card: Insert<'cards'>) {
  const { error } = await supabase.from('cards').insert(card)
  if (error) throw error
}

export async function updateCard(id: string, patch: Update<'cards'>) {
  const { error } = await supabase.from('cards').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from('cards').delete().eq('id', id)
  if (error) throw error
}
