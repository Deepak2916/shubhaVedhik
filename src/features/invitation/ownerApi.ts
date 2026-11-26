import { AppError, unwrap } from '@/lib/errors'
import { signPaths } from '@/lib/storage/storage'
import { supabase } from '@/lib/supabase/client'
import { hydrate, type LoadedInvitation, type WeddingPayload } from './hydrate'

/** The signed-in owner's preview of their (possibly unpublished) wedding. */
export async function fetchWeddingPreview(weddingId: string): Promise<LoadedInvitation> {
  const payload = unwrap(await supabase.rpc('get_wedding_preview', { p_wedding: weddingId })) as WeddingPayload | null
  if (!payload) throw new AppError('Wedding not found.')
  return hydrate(payload, signPaths)
}
