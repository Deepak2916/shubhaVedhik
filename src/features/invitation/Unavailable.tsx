import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Primitives'

export function InvitationUnavailable({ reason = 'unavailable' }: { reason?: 'unavailable' | 'error' }) {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-plum px-6 text-center text-paper">
      <svg viewBox="0 0 64 64" className="size-16" aria-hidden>
        <path d="M32 8c6 8 9 13 9 20a9 9 0 0 1-18 0c0-7 3-12 9-20z" fill="#E7A626" opacity=".35" />
        <path d="M10 40h44c-3 10-11 16-22 16S13 50 10 40z" fill="#9E1B3C" />
      </svg>
      <h1 className="mt-6 font-display text-3xl sm:text-4xl">
        {reason === 'error' ? 'We couldn’t load this invitation' : 'This invitation isn’t available'}
      </h1>
      <p className="mt-3 max-w-md text-paper/70">
        {reason === 'error'
          ? 'Check your connection and refresh the page.'
          : 'The couple may have taken it offline, or the link may be mistyped. Please check with the person who shared it.'}
      </p>
      <Link to="/" className="mt-10 opacity-80 hover:opacity-100">
        <Logo light />
      </Link>
    </div>
  )
}

export function InvitationLoading() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-plum" role="status" aria-label="Loading invitation">
      <svg viewBox="0 0 64 64" className="size-14" aria-hidden>
        <path className="anim-flicker" d="M32 8c6 8 9 13 9 20a9 9 0 0 1-18 0c0-7 3-12 9-20z" fill="#E7A626" />
        <path d="M10 40h44c-3 10-11 16-22 16S13 50 10 40z" fill="#9E1B3C" />
      </svg>
    </div>
  )
}
