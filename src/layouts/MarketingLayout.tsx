import { Menu, X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Primitives'
import { useAuth } from '@/features/auth/AuthProvider'
import { cn } from '@/lib/cn'

const NAV = [
  { to: '/templates', label: 'Invitations' },
  { to: '/#how', label: 'How it works' },
  { to: '/#features', label: 'Features' },
  { to: '/about', label: 'About' },
]

export default function MarketingLayout() {
  const { pathname, hash } = useLocation()
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const overHero = pathname === '/' && !scrolled && !open

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="flex min-h-[100svh] flex-col">
      <a href="#main" className="sr-only z-[100] rounded bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <header className={cn('fixed inset-x-0 top-0 z-50 transition-colors duration-300', overHero ? 'bg-transparent' : 'bg-paper/90 shadow-[0_1px_0_var(--color-rose)] backdrop-blur-md')}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:h-18 sm:px-8">
          <Link to="/" aria-label="ShubhaVedhik home">
            <Logo light={overHero} />
          </Link>
          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={cn('rounded-full px-4 py-2 text-[0.95rem] transition', overHero ? 'text-paper/85 hover:text-paper' : 'text-plum-soft hover:bg-blush hover:text-plum')}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            {user ? (
              <ButtonLink to="/dashboard" variant={overHero ? 'light' : 'primary'} size="sm">
                My weddings
              </ButtonLink>
            ) : (
              <>
                <Link to="/login" className={cn('px-3 text-[0.95rem]', overHero ? 'text-paper/85 hover:text-paper' : 'text-plum-soft hover:text-plum')}>
                  Sign in
                </Link>
                <ButtonLink to="/register" variant={overHero ? 'gold' : 'primary'} size="sm">
                  Create your invitation
                </ButtonLink>
              </>
            )}
          </div>
          <button type="button" onClick={() => setOpen((o) => !o)} className={cn('ml-auto grid size-11 place-items-center rounded-full sm:ml-0 lg:hidden', overHero ? 'text-paper' : 'text-plum')} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <m.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-rose bg-paper lg:hidden" aria-label="Mobile">
              <div className="flex flex-col gap-1 px-4 py-4">
                {NAV.map((n) => (
                  <Link key={n.to} to={n.to} className="rounded-xl px-4 py-3 text-lg hover:bg-blush">
                    {n.label}
                  </Link>
                ))}
                <div className="mt-3 flex gap-2 border-t border-rose pt-4">
                  {user ? (
                    <ButtonLink to="/dashboard" className="flex-1">My weddings</ButtonLink>
                  ) : (
                    <>
                      <ButtonLink to="/login" variant="secondary" className="flex-1">Sign in</ButtonLink>
                      <ButtonLink to="/register" className="flex-1">Get started</ButtonLink>
                    </>
                  )}
                </div>
              </div>
            </m.nav>
          )}
        </AnimatePresence>
      </header>
      <main id="main" className={cn('flex-1', pathname !== '/' && 'pt-16 sm:pt-18')}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="bg-plum text-paper/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">Animated wedding invitations for Indian weddings — every ritual, every language, one link your family can open anywhere.</p>
        </div>
        <FooterCol title="Invitations" links={[['/templates', 'All templates'], ['/preview/royal-telugu', 'Royal Telugu'], ['/preview/royal-nikah', 'Royal Nikah'], ['/preview/reel-cinematic', 'Cinematic story']]} />
        <FooterCol title="Company" links={[['/about', 'About'], ['/contact', 'Contact']]} />
        <FooterCol title="Legal" links={[['/terms', 'Terms'], ['/privacy', 'Privacy']]} />
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-paper/50">© {new Date().getFullYear()} ShubhaVedhik. Made in India, with love.</div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-haldi">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="hover:text-paper">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
