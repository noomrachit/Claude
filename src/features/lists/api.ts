import { supabase } from '@/lib/supabase/client'
import type { Insert, Update } from '@/types'

export async function insertList(list: Insert<'lists'>) {
  const { error } = await supabase.from('lists').insert(list)
  if (error) throw error
}

export async function updateList(id: string, patch: Update<'lists'>) {
  const { error } = await supabase.from('lists').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteList(id: string) {
  const { error } = await supabase.from('lists').delete().eq('id', id)
  if (error) throw error
}
