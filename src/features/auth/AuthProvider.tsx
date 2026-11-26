import type { Session, User } from '@supabase/supabase-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { env } from '@/lib/env'
import { supabase } from '@/lib/supabase/client'

interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  /** Server-verified via is_admin() — never derived from client data. */
  isAdmin: boolean
  adminLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(env.isConfigured)
  const qc = useQueryClient()

  useEffect(() => {
    if (!env.isConfigured) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  const admin = useQuery({
    queryKey: ['is-admin', userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_admin')
      if (error) return false
      return data === true
    },
  })

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isAdmin: Boolean(userId && admin.data),
      adminLoading: Boolean(userId) && admin.isLoading,
      signOut: async () => {
        await supabase.auth.signOut()
        qc.clear()
      },
    }),
    [session, loading, userId, admin.data, admin.isLoading, qc],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
