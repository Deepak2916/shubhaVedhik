interface PgLikeError {
  message: string
  code?: string
  details?: string | null
  hint?: string | null
}

/** Converts Supabase/PostgREST errors into messages a customer can act on. */
export function friendlyError(error: unknown): string {
  if (!error) return 'Something went wrong. Try again.'
  if (typeof error === 'string') return error
  const e = error as PgLikeError
  const msg = e.message ?? String(error)
  if (e.code === '23505' || /duplicate key/i.test(msg)) {
    if (/slug/i.test(msg)) return 'That link is already taken. Try a different one.'
    return 'That already exists.'
  }
  if (e.code === '42501' || /permission denied|row-level security|Not allowed/i.test(msg)) {
    return 'You don’t have permission to do that.'
  }
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'No connection. Check your internet and try again.'
  if (/Invalid login credentials/i.test(msg)) return 'Email or password is incorrect.'
  if (/Email not confirmed/i.test(msg)) return 'Confirm your email first — check your inbox for the link.'
  if (/JWT expired/i.test(msg)) return 'Your session expired. Sign in again.'
  return msg.replace(/^Cannot publish yet: /, 'Before publishing: ')
}

export class AppError extends Error {}

/** Unwraps a Supabase response, throwing on error. */
export function unwrap<T>(res: { data: T | null; error: PgLikeError | null }): T {
  if (res.error) throw new AppError(friendlyError(res.error))
  return res.data as T
}
