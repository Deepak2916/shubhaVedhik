import { env } from '../env'

/** Public URL for an object in the public template-assets bucket (no client needed). */
export const templateAssetUrl = (path: string) => `${env.supabaseUrl}/storage/v1/object/public/template-assets/${path.split('/').map(encodeURIComponent).join('/')}`
