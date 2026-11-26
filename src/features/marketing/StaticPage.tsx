import { useLocation } from 'react-router-dom'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

const PAGES: Record<string, { title: string; intro: string; sections: { h: string; p: string }[] }> = {
  '/about': {
    title: 'About ShubhaVedhik',
    intro: 'Shubha vedhika means the auspicious stage — the mandap where everything begins. We build invitations worthy of it.',
    sections: [
      { h: 'Why we exist', p: 'Indian weddings are many ceremonies, many languages and many generations of guests. Printed cards can’t carry the music, the photos or the directions to the haldi; generic e-cards don’t understand pellikuthuru, nikah or anand karaj. ShubhaVedhik does both: the ceremony of opening an invitation, and the practical details every guest needs.' },
      { h: 'How we design', p: 'Every template is built around a real tradition’s visual language — temple architecture, girih geometry, painted florals, festive marigolds, editorial minimalism, cinema — and then left open, so any couple can choose any style and name their own rituals.' },
      { h: 'Built for real phones', p: 'Most guests open invitations from WhatsApp on mid-range Android phones. Images are optimised on upload, videos load only when played, and the whole invitation is a single fast page.' },
    ],
  },
  '/contact': {
    title: 'Contact',
    intro: 'We usually reply within one working day.',
    sections: [
      { h: 'Support', p: 'For help with your invitation, write to the support address configured for this site (see platform settings) with your invitation link.' },
      { h: 'Partnerships', p: 'Wedding planners, photographers and studios who want custom templates for their couples are welcome to get in touch.' },
    ],
  },
  '/terms': {
    title: 'Terms of use',
    intro: 'The short version: your content stays yours, and you’re responsible for what you publish.',
    sections: [
      { h: 'Your content', p: 'You keep ownership of photos, videos, music and text you upload. You grant us the permission needed to store and display them to people who open your invitation link.' },
      { h: 'Acceptable use', p: 'Upload only content you have the right to share. Don’t use the service to publish unlawful, harmful or misleading material, or to impersonate others.' },
      { h: 'Availability', p: 'We work hard to keep invitations online and fast but can’t guarantee uninterrupted service. Unpublished or deleted invitations stop being accessible immediately.' },
      { h: 'Music', p: 'Platform tracks are provided royalty-free for use within your invitation. If you upload your own music, make sure you have the right to use it.' },
    ],
  },
  '/privacy': {
    title: 'Privacy',
    intro: 'We collect as little as we can, and never sell anything.',
    sections: [
      { h: 'Couples', p: 'We store your account email and the invitation content you create. Draft media is private; only you can see it until you publish.' },
      { h: 'Guests', p: 'Guests never sign in. For visit counts we store an anonymous hash created from a random identifier kept in the guest’s own browser, the date, whether the visit came from a QR code or a link, and a device class (phone, tablet or computer). We do not store IP addresses or browser fingerprints.' },
      { h: 'Deleting data', p: 'Deleting a wedding permanently removes its content and uploaded files. Unpublishing takes the invitation offline immediately without deleting it.' },
    ],
  },
}

export default function StaticPage() {
  const { pathname } = useLocation()
  const page = PAGES[pathname] ?? PAGES['/about']
  useDocumentMeta({ title: `${page.title} · ShubhaVedhik`, description: page.intro })
  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <h1 className="font-display text-[clamp(2.4rem,6vw,3.6rem)] leading-tight">{page.title}</h1>
      <p className="mt-4 text-xl leading-relaxed text-plum-soft">{page.intro}</p>
      <div className="mt-12 space-y-10">
        {page.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-xl font-semibold">{s.h}</h2>
            <p className="mt-3 leading-relaxed text-mist">{s.p}</p>
          </section>
        ))}
      </div>
    </article>
  )
}
