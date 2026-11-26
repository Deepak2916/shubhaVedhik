import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/ui/Primitives'
import { env } from '@/lib/env'
import { SetupRequired } from '@/components/SetupRequired'
import { useAuth } from './AuthProvider'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (!env.isConfigured) return <SetupRequired />
  if (loading) return <PageLoader />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <>{children}</>
}

/**
 * UI-level guard only. Every admin read/write is independently enforced by
 * RLS policies and is_admin()/assert_admin() checks in the database.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, adminLoading } = useAuth()
  if (!env.isConfigured) return <SetupRequired />
  if (loading || adminLoading) return <PageLoader />
  if (!user) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <Navigate to="/admin/login?denied=1" replace />
  return <>{children}</>
}
