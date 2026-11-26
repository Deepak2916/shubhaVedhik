import { Album, ArrowLeft, LayoutDashboard, LogOut, Music2, Tags } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/ui/Primitives'
import { useAuth } from '@/features/auth/AuthProvider'
import { RequireAdmin } from '@/features/auth/guards'
import { cn } from '@/lib/cn'

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/templates', label: 'Templates', icon: Album },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/library', label: 'Music library', icon: Music2 },
]

export default function AdminLayout() {
  return (
    <RequireAdmin>
      <AdminShell />
    </RequireAdmin>
  )
}

function AdminShell() {
  const { signOut, user } = useAuth()
  return (
    <div className="min-h-[100svh] bg-[#f6f1f0] lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col bg-plum text-paper lg:sticky lg:top-0 lg:h-[100svh]">
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <Link to="/admin">
            <Logo light />
          </Link>
          <span className="rounded-full bg-haldi px-2 py-0.5 text-[0.7rem] font-semibold text-plum">Admin</span>
        </div>
        <nav className="snap-row gap-1 px-3 pb-3 lg:flex-col lg:overflow-visible" aria-label="Admin">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => cn('inline-flex h-10 shrink-0 items-center gap-3 rounded-xl px-3 text-sm transition', isActive ? 'bg-white/12 text-white' : 'text-paper/70 hover:bg-white/8 hover:text-white')}
            >
              <n.icon className="size-4" aria-hidden /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden space-y-1 border-t border-white/10 p-3 lg:block">
          <p className="truncate px-3 pb-2 text-xs text-paper/50">{user?.email}</p>
          <Link to="/dashboard" className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-paper/70 hover:bg-white/8">
            <ArrowLeft className="size-4" aria-hidden /> Customer dashboard
          </Link>
          <button type="button" onClick={() => void signOut()} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-paper/70 hover:bg-white/8">
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  )
}
