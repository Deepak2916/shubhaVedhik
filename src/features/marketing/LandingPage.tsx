import { CalendarRange, Clapperboard, Images, Languages, MessageSquareHeart, Music2, QrCode, Sparkles } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { QRCodeSVG } from 'qrcode.react'
import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '@/components/ui/Button'
import { Chips } from '@/components/ui/Field'
import { Skeleton } from '@/components/ui/Primitives'
import { EnvelopeScene } from '@/features/invitation/engine/openings/Openings'
import { usePublishedTemplates } from '@/features/templates/api'
import { TemplateCard } from '@/features/templates/TemplateCard'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'
import { env } from '@/lib/env'

const ENVELOPE_THEME = {
  '--inv-bg': '#FFFBF5',
  '--inv-surface': '#F4E6D4',
  '--inv-text': '#3B1F2B',
  '--inv-muted': '#8B6F66',
  '--inv-primary': '#9E1B3C',
  '--inv-accent': '#E7A626',
  '--inv-on-primary': '#FFF6E6',
  '--inv-border': '#E2CDB5',
  '--inv-font-display': "'Rozha One', serif",
  '--inv-font-script': "'Rozha One', serif",
  '--inv-font-body': "'Mukta', sans-serif",
} as CSSProperties

const SCRIPTS = ['తెలుగు', 'தமிழ்', 'ಕನ್ನಡ', 'മലയാളം', 'हिन्दी', 'বাংলা', 'मराठी', 'ગુજરાતી', 'ਪੰਜਾਬੀ', 'اردو', 'English']

function HeroEnvelope() {
  const [opened, setOpened] = useState(false)
  return (
    <div className="inv-root relative mx-auto w-full max-w-[440px] pb-14" style={{ ...ENVELOPE_THEME, background: 'transparent' }}>
      <AnimatePresence mode="wait">
        {!opened ? (
          <m.div key="env" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
            <EnvelopeScene onOpen={() => setOpened(true)} monogram="H·K" recipient="Tap the seal" recipientClassName="text-paper/75" compact>
              <p className="text-[0.6rem] tracking-[0.3em] text-inv-muted">SUBHA VIVAHA AHVANAM</p>
              <p className="inv-display mt-1 text-2xl text-inv-text">Harika &amp; Sai Karthik</p>
              <p className="mt-1 text-[0.7rem] text-inv-primary">14 February 2027 · Hyderabad</p>
            </EnvelopeScene>
          </m.div>
        ) : (
          <m.div key="card" initial={{ opacity: 0, y: 30, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto max-w-[340px] overflow-hidden rounded-[20px] bg-[#4A0D18] text-center text-[#F6E7C6] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)]">
            <img src="/demo/photos/bride-silk-sm.webp" alt="" className="h-56 w-full object-cover" />
            <div className="px-6 pt-5 pb-7">
              <p className="text-xs text-[#EBCB72]">శుభ వివాహ ఆహ్వానం</p>
              <p className="mt-2 font-display text-3xl">Harika &amp; Sai Karthik</p>
              <p className="mt-1 text-sm text-[#D8BC86]">Sumuhurtham 10:42 AM · 14 Feb 2027</p>
              <Link to="/preview/royal-telugu" className="mt-5 inline-flex h-11 items-center rounded-full bg-[#C9A24A] px-6 text-sm font-medium text-[#3A0811]">
                Open the full invitation
              </Link>
              <button type="button" onClick={() => setOpened(false)} className="mt-3 block w-full text-xs text-[#D8BC86] underline-offset-4 hover:underline">
                Seal it again
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Hero() {
  const reduce = useReducedMotion()
  const rise = (i: number) => (reduce ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] as const } })
  return (
    <section className="relative isolate overflow-hidden bg-plum text-paper">
      <img src="/demo/photos/fairy-lights.webp" alt="" className="absolute inset-0 -z-20 size-full object-cover object-[50%_30%]" fetchPriority="high" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,#2B1730_8%,rgb(43_23_48/0.88)_45%,rgb(43_23_48/0.55)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_60%,rgb(231_166_38/0.22),transparent_45%)]" />
      <div className="mx-auto grid min-h-[100svh] max-w-7xl items-center gap-12 px-4 pt-28 pb-16 sm:px-8 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <m.p {...rise(0)} className="text-haldi">Digital wedding invitations for Indian families</m.p>
          <m.h1 {...rise(1)} className="mt-5 font-display text-[clamp(2.9rem,7.5vw,6rem)] leading-[0.98] tracking-tight">
            Your love story deserves a beautiful beginning.
          </m.h1>
          <m.p {...rise(2)} className="mt-6 max-w-xl text-lg leading-relaxed text-paper/80">
            An animated invitation that opens like a real one — with your photos, your music, every ceremony from haldi to reception, and one QR code your whole family can scan.
          </m.p>
          <m.div {...rise(3)} className="mt-9 flex flex-wrap gap-3">
            <ButtonLink to="/templates" variant="gold" size="lg">
              Explore invitations
            </ButtonLink>
            <ButtonLink to="/register" variant="light" size="lg">
              Create your invitation
            </ButtonLink>
          </m.div>
        </div>
        <m.div initial={reduce ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <HeroEnvelope />
        </m.div>
      </div>
      <div className="border-t border-white/10 bg-plum/70 backdrop-blur">
        <p className="sr-only">Available in Telugu, Tamil, Kannada, Malayalam, Hindi, Bengali, Marathi, Gujarati, Punjabi, Urdu and English</p>
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-5 text-lg text-paper/70 sm:justify-between sm:px-8" aria-hidden>
          {SCRIPTS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function FeaturedTemplates() {
  const q = usePublishedTemplates()
  const [cat, setCat] = useState<string[]>([])
  const cats = useMemo(() => {
    const seen = new Map<string, string>()
    q.data?.forEach((t) => t.category && seen.set(t.category.slug, t.category.name))
    return [...seen].map(([value, label]) => ({ value, label }))
  }, [q.data])
  const list = (q.data ?? []).filter((t) => cat.length === 0 || (t.category && cat.includes(t.category.slug)))
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8 sm:py-32" aria-labelledby="featured-title">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <h2 id="featured-title" className="font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.02]">Six worlds to begin in</h2>
          <p className="mt-3 text-lg text-mist">Each design has its own opening, ornament and rhythm. Tap one to play it exactly as your guests will.</p>
        </div>
        <Chips label="Filter by style" options={[{ value: '', label: 'All' }, ...cats]} value={cat.length ? cat : ['']} onChange={(v) => setCat(v.filter(Boolean).slice(-1))} multiple={false} />
      </div>
      <div className="snap-row -mx-4 mt-12 gap-6 px-4 pb-4 sm:-mx-8 sm:px-8">
        {q.isLoading && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] w-[78vw] max-w-[320px] shrink-0 rounded-[18px]" />)}
        {list.map((t) => (
          <TemplateCard key={t.id} t={t} className="w-[78vw] max-w-[320px] shrink-0" action={<Link to={`/preview/${t.slug}`} className="text-kumkum hover:underline">Live preview</Link>} />
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  const demoUrl = `${env.siteUrl}/preview/utsav-traditional`
  const steps = [
    { title: 'Choose a design', body: 'Pick from royal, traditional, floral, modern and cinematic invitations — every one previewable before you sign up.', art: <img src="/demo/photos/attire-flowers-sm.webp" alt="" className="size-full object-cover" loading="lazy" /> },
    { title: 'Make it yours', body: 'Add names in English and your language, the families, every ceremony, photos, your pre-wedding film and a song.', art: <img src="/demo/photos/mehndi-circle-sm.webp" alt="" className="size-full object-cover" loading="lazy" /> },
    {
      title: 'Share one link',
      body: 'Publish to get your own address and a QR code for the printed card, WhatsApp and the family group. Unlimited guests, no app, no sign-in.',
      art: (
        <div className="grid size-full place-items-center bg-white p-6">
          <QRCodeSVG value={demoUrl} size={168} fgColor="#2B1730" level="M" title="Scan to open a demo invitation" />
        </div>
      ),
    },
  ]
  return (
    <section id="how" className="bg-blush/60 py-24 sm:py-32" aria-labelledby="how-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <h2 id="how-title" className="max-w-xl font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.02]">From idea to every phone in the family, in an evening</h2>
        <ol className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <div className="aspect-[4/3] overflow-hidden rounded-[18px] bg-rose">{s.art}</div>
              <p className="mt-6 font-display text-5xl text-kumkum">{i + 1}</p>
              <h3 className="mt-2 text-2xl font-semibold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-mist">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const STYLES = [
  { label: 'Traditional Indian', img: 'bride-red', to: '/templates?style=traditional' },
  { label: 'Royal Indian', img: 'bride-silk', to: '/templates?style=royal' },
  { label: 'Minimalist', img: 'sea-minimal', to: '/templates?style=modern' },
  { label: 'Modern luxury', img: 'hands-shadow', to: '/templates?style=modern' },
  { label: 'Floral', img: 'church-altar', to: '/templates?style=floral' },
  { label: 'Cinematic', img: 'red-sky', to: '/templates?style=cinematic' },
  { label: 'Cultural & regional', img: 'nikah-lattice', to: '/templates' },
]

function Styles() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8 sm:py-32" aria-labelledby="styles-title">
      <h2 id="styles-title" className="max-w-2xl font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.02]">A style for every family — and every ritual within it</h2>
      <p className="mt-3 max-w-2xl text-lg text-mist">Styles are starting points, not rules. A Telugu family can choose an editorial design; a Nikah can be cinematic. You decide which ceremonies appear and how they’re named.</p>
      <div className="mt-12 grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] md:grid-cols-4">
        {STYLES.map((s, i) => (
          <Link key={s.label} to={s.to} className={`group relative overflow-hidden rounded-[18px] ${i === 0 ? 'row-span-2' : ''}`}>
            <img src={`/demo/photos/${s.img}-sm.webp`} alt="" loading="lazy" className="size-full object-cover transition duration-[1.2s] group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-plum/80 to-transparent" />
            <span className="absolute bottom-4 left-4 font-display text-2xl text-paper">{s.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

const FEATURES = [
  { icon: Sparkles, title: 'Animated openings', body: 'Temple doors, a wax-sealed envelope, marigold curtains or a film leader — the first tap feels like an occasion.' },
  { icon: Images, title: 'Photo galleries', body: 'Portraits, engagement and family photos, optimised automatically and viewable full-screen with a swipe.' },
  { icon: Clapperboard, title: 'Pre-wedding videos', body: 'Upload MP4 or WebM. Nothing downloads until a guest presses play, so the invitation stays fast.' },
  { icon: Music2, title: 'Background music', body: 'Your song or one of ours, starting the moment the invitation opens — with play, mute and volume always in reach.' },
  { icon: CalendarRange, title: 'Every event', body: 'Haldi, mehendi, sangeet, nikah, church ceremony, reception — unlimited events with dress codes, directions and calendar links.' },
  { icon: QrCode, title: 'QR code sharing', body: 'Download as PNG for WhatsApp or SVG for the printer. Scans are counted separately so you know what worked.' },
  { icon: MessageSquareHeart, title: 'Your words', body: 'Invitation, family message, your story, blessings and thank-you notes, in as many languages as your family speaks.' },
  { icon: Languages, title: 'Bilingual by default', body: 'Names and messages in Telugu, Tamil, Hindi, Urdu and more, set in proper typefaces for each script.' },
]

function Features() {
  return (
    <section id="features" className="bg-plum py-24 text-paper sm:py-32" aria-labelledby="features-title">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id="features-title" className="font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.02]">Everything a printed card can’t do</h2>
          <p className="mt-4 max-w-md text-lg text-paper/70">Built for the way invitations actually travel in India: forwarded on WhatsApp, scanned from a card, opened on a three-year-old Android phone on 4G.</p>
          <div className="mt-10 hidden aspect-[4/5] max-w-sm overflow-hidden rounded-t-full lg:block">
            <img src="/demo/photos/couple-regal-sm.webp" alt="" loading="lazy" className="size-full object-cover" />
          </div>
        </div>
        <ul className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f.title} className="border-t border-white/15 pt-6">
              <f.icon className="size-6 text-haldi" aria-hidden />
              <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-paper/70">{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const SHOWCASE = [
  { slug: 'reel-cinematic', couple: 'Meera & Kabir', place: 'Goa', img: 'red-sky' },
  { slug: 'royal-nikah', couple: 'Zoya & Ayaan', place: 'Lucknow', img: 'nikah-lattice' },
  { slug: 'utsav-traditional', couple: 'Ananya & Rohan', place: 'Jaipur', img: 'fairy-lights' },
  { slug: 'ivory-bloom', couple: 'Anna & Joel', place: 'Kochi', img: 'church-kiss' },
]

function Showcase() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8 sm:py-32" aria-labelledby="showcase-title">
      <h2 id="showcase-title" className="max-w-2xl font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.02]">Open a finished invitation</h2>
      <p className="mt-3 max-w-xl text-lg text-mist">Complete sample weddings, with music, events and galleries. Turn your sound on.</p>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {SHOWCASE.map((s) => (
          <Link key={s.slug} to={`/preview/${s.slug}`} className="group relative aspect-[16/11] overflow-hidden rounded-[22px]">
            <img src={`/demo/photos/${s.img}.webp`} alt="" loading="lazy" className="size-full object-cover transition duration-[1.4s] group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <span className="absolute bottom-6 left-6 text-paper">
              <span className="block font-display text-4xl">{s.couple}</span>
              <span className="text-paper/80">{s.place} — open invitation</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="px-4 pb-24 sm:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-kumkum px-6 py-16 text-center text-paper sm:px-16">
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 1px 1px, #E7A626 1px, transparent 1.6px) 0 0 / 22px 22px' }} aria-hidden />
        <h2 className="relative mx-auto max-w-2xl font-display text-[clamp(2rem,5vw,3.4rem)] leading-[1.05]">Start your invitation tonight. Publish when the family approves.</h2>
        <p className="relative mx-auto mt-4 max-w-lg text-paper/80">Drafts stay private until you publish. Change anything, any time — the QR code never changes.</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/register" variant="gold" size="lg">
            Create your invitation
          </ButtonLink>
          <ButtonLink to="/templates" variant="light" size="lg">
            Browse designs
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  useDocumentMeta({
    title: 'ShubhaVedhik — Animated Indian wedding invitations with QR sharing',
    description: 'Create an animated wedding invitation with photos, music, every ceremony and a QR code. Telugu, Tamil, Hindi, Urdu, Malayalam and more.',
    canonical: env.siteUrl + '/',
  })
  return (
    <>
      <Hero />
      <FeaturedTemplates />
      <HowItWorks />
      <Styles />
      <Features />
      <Showcase />
      <FinalCta />
    </>
  )
}
