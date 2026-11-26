import { Outlet } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'

/**
 * Auth-aware part of the app (marketing, account, dashboard, admin). Loaded
 * lazily so the guest invitation route never downloads the auth client.
 */
export default function AuthRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
