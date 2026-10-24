import type { Session } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client'
import { authErrorMessage } from './authErrors'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    // Keep this callback synchronous: awaiting supabase calls inside it can deadlock.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        return error ? authErrorMessage(error) : null
      },
      async signUp(email, password, displayName) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: displayName?.trim() ? { full_name: displayName.trim() } : undefined },
        })
        if (error) return { error: authErrorMessage(error), needsConfirmation: false }
        // With email confirmation on, an already-registered address returns a user with no identities.
        if (data.user && data.user.identities?.length === 0) {
          return { error: authErrorMessage({ code: 'user_already_exists' }), needsConfirmation: false }
        }
        return { error: null, needsConfirmation: !data.session }
      },
      async signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        })
        return error ? authErrorMessage(error) : null
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        return error ? authErrorMessage(error) : null
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password })
        return error ? authErrorMessage(error) : null
      },
      async signOut() {
        await supabase.auth.signOut()
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
