import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// Falls back to placeholders so the UI can render a setup hint instead of crashing.
export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'missing-anon-key',
)
