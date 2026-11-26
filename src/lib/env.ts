const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined) ?? window.location.origin

export const env = {
  supabaseUrl: url ?? '',
  supabaseAnonKey: anonKey ?? '',
  /** Public origin used in QR codes and share links, e.g. https://shubhavedhik.com */
  siteUrl: siteUrl.replace(/\/$/, ''),
  isConfigured: Boolean(url && anonKey),
}
console.log('env...',env)

export const invitationUrl = (slug: string) => `${env.siteUrl}/w/${slug}`
