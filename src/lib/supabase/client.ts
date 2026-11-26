import { createClient } from '@supabase/supabase-js'
import { env } from '../env'

/**
 * Browser client. Uses the public anon key only — every permission is enforced
 * by Row Level Security and SECURITY DEFINER RPCs in the database. The
 * service-role key must never be shipped to the browser.
 */
export const supabase = createClient(env.supabaseUrl || 'http://localhost:54321', env.supabaseAnonKey || 'missing-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
})

export const WEDDING_BUCKET = 'wedding-assets'
export const TEMPLATE_BUCKET = 'template-assets'
