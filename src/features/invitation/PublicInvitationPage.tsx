import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { env, invitationUrl } from '@/lib/env'
import { fetchPublicWedding, recordInteraction, recordVisit } from './publicApi'
import type { GuestAction } from './engine/context'
import { InvitationRenderer } from './engine/InvitationRenderer'
import { InvitationLoading, InvitationUnavailable } from './Unavailable'

export default function PublicInvitationPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const q = useQuery({
    queryKey: ['public-wedding', slug],
    queryFn: () => fetchPublicWedding(slug),
    enabled: env.isConfigured && Boolean(slug),
    staleTime: 5 * 60_000,
    retry: 1,
  })

  const inv = q.data
  useDocumentMeta({
    title: inv ? `${inv.data.brideName} & ${inv.data.groomName} — Wedding invitation` : 'Wedding invitation',
    description: inv ? `You're invited to celebrate the wedding of ${inv.data.brideName} & ${inv.data.groomName}${inv.data.city ? ` in ${inv.data.city}` : ''}.` : undefined,
    image: inv?.data.coverUrl,
    canonical: invitationUrl(slug),
  })

  // Record one visit per session; ?src=qr marks QR scans, then is removed from the URL.
  useEffect(() => {
    if (!inv) return
    const source = params.get('src') === 'qr' ? 'qr' : 'link'
    void recordVisit(slug, source)
    if (params.has('src')) window.history.replaceState(null, '', `/w/${slug}`)
  }, [inv, slug, params])

  const onTrack = useCallback((a: GuestAction) => recordInteraction(slug, a), [slug])

  if (!env.isConfigured) return <InvitationUnavailable />
  if (q.isLoading) return <InvitationLoading />
  if (q.isError) return <InvitationUnavailable reason="error" />
  if (!inv) return <InvitationUnavailable />
  return <InvitationRenderer template={inv.template} data={inv.data} mode="live" onTrack={onTrack} />
}
