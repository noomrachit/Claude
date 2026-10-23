import type { Session, User } from '@supabase/supabase-js'
import { createContext } from 'react'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  /** True until the stored session has been read once. */
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<string | null>
  /** Resolves to an error message, or `{ needsConfirmation }` on success. */
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signInWithGoogle: () => Promise<string | null>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
