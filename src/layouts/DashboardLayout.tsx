import { Heart, LogOut, Shield, User } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/ui/Primitives'
import { useAuth } from '@/features/auth/AuthProvider'
import { RequireAuth } from '@/features/auth/guards'
import { cn } from '@/lib/cn'

export default function DashboardLayout() {
  return (
    <RequireAuth>
      <DashboardShell />
    </RequireAuth>
  )
}

function DashboardShell() {
  const { user, signOut, isAdmin } = useAuth()
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email
  const item = ({ isActive }: { isActive: boolean }) => cn('inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm transition', isActive ? 'bg-plum text-paper' : 'text-plum-soft hover:bg-blush')
  return (
    <div className="min-h-[100svh] bg-paper">
      <header className="sticky top-0 z-40 border-b border-rose/80 bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-8">
          <Link to="/dashboard" aria-label="Dashboard">
            <Logo />
          </Link>
          <nav className="ml-4 hidden gap-1 sm:flex" aria-label="Dashboard">
            <NavLink to="/dashboard" end className={item}>
              <Heart className="size-4" aria-hidden /> My weddings
            </NavLink>
            <NavLink to="/dashboard/account" className={item}>
              <User className="size-4" aria-hidden /> Account
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={item}>
                <Shield className="size-4" aria-hidden /> Admin
              </NavLink>
            )}
          </nav>
          <span className="ml-auto hidden max-w-48 truncate text-sm text-mist md:block">{name}</span>
          <button type="button" onClick={() => void signOut()} className="ml-auto inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm text-mist hover:bg-blush hover:text-plum md:ml-2" aria-label="Sign out">
            <LogOut className="size-4" aria-hidden /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
        <nav className="flex gap-1 px-4 pb-2 sm:hidden" aria-label="Dashboard mobile">
          <NavLink to="/dashboard" end className={item}>My weddings</NavLink>
          <NavLink to="/dashboard/account" className={item}>Account</NavLink>
          {isAdmin && <NavLink to="/admin" className={item}>Admin</NavLink>}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}
