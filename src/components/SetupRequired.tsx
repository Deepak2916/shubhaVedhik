import { Database } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from './ui/Primitives'

/** Shown for account/admin areas when VITE_SUPABASE_* env vars are missing. */
export function SetupRequired() {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-paper px-6 text-center">
      <Link to="/">
        <Logo />
      </Link>
      <div className="mt-10 max-w-lg rounded-[22px] bg-white p-8 text-left shadow-card ring-1 ring-rose">
        <Database className="size-7 text-kumkum" aria-hidden />
        <h1 className="mt-4 font-display text-2xl">Connect Supabase to continue</h1>
        <p className="mt-2 text-mist">Accounts, weddings and the admin console need a Supabase project. Template previews work without one.</p>
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm">
          <li>Copy <code className="rounded bg-blush px-1">.env.example</code> to <code className="rounded bg-blush px-1">.env.local</code></li>
          <li>Set <code className="rounded bg-blush px-1">VITE_SUPABASE_URL</code> and <code className="rounded bg-blush px-1">VITE_SUPABASE_ANON_KEY</code></li>
          <li>Apply the migrations and seed (see README.md), then restart the dev server</li>
        </ol>
      </div>
    </div>
  )
}
