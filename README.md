# ShubhaVedhik

Animated digital wedding invitations for Indian weddings: a customer builds an
invitation (details, traditions, languages, design, photos, videos, music,
events, messages), publishes it, and shares one link and QR code with unlimited
guests. Admins design templates in a versioned, section-based builder.

**Stack:** React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Motion · TanStack
Query · React Hook Form + Zod · Supabase (Postgres, Auth, Storage) · Howler.js.

## Quick start (no backend)

```bash
npm install
npm run dev            # http://localhost:5173
```

Without Supabase env vars the marketing site and all six template demos work
from bundled presets (`/preview/royal-telugu`, `/preview/reel-cinematic`, …).
Accounts, weddings and the admin console show a "Connect Supabase" screen.

## Full setup

1. **Create a Supabase project.**
2. **Apply the schema** — either `supabase db push` with the Supabase CLI, or run
   the files in `supabase/migrations/` in order in the SQL editor, then
   `supabase/seed.sql` (categories, music library, six templates).
3. **Environment** — `cp .env.example .env.local` and set `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`.
4. **Auth settings** (Dashboard → Authentication → URL configuration):
   Site URL = your `VITE_SITE_URL`; add `…/login`, `…/reset-password` and
   `…/dashboard*` to redirect URLs. Keep "Confirm email" on.
5. **First admin** — sign up in the app, then run `scripts/grant-admin.sql`
   (with your email) in the SQL editor. Sign in at `/admin/login`.
6. `npm run dev`.

## Deploy

Netlify (recommended — includes social previews):

- Connect the repo; `netlify.toml` sets build, SPA fallback and cache headers.
- Set the three `VITE_*` env vars in the Netlify UI (the edge function reads the
  same two Supabase vars).
- `netlify/edge-functions/invitation-meta.ts` rewrites `<head>` for `/w/:slug`
  so WhatsApp/Facebook/X show the couple's names, date and cover photo.

Any other static host works for everything except crawler previews: build with
`npm run build`, serve `dist/`, and rewrite all paths to `/index.html`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | oxlint |
| `npm run test:db` | Applies all migrations + seed to an in-process Postgres (PGlite) and runs 25 RLS/RPC/storage-policy tests |
| `npm run seed:generate` | Regenerates `supabase/seed.sql` from `src/features/templates/presets/presets.ts` |
| `ANALYZE=1 npx vite build` | One chunk per npm package, to inspect bundle size |

## Where things are

```
src/
  app/                 providers, router (all routes lazy)
  components/ui/       design-system primitives
  features/
    invitation/engine/ template rendering engine (sections, openings, motifs, music, lightbox)
    invitation/        public /w/:slug, demos, live preview iframe, data loaders
    templates/         catalogue + presets (single source for seed.sql)
    weddings/          customer data layer + 9-step wizard
    dashboard/         weddings list, overview, share/QR, account
    admin/             dashboard, template builder, versions, categories, music library
    analytics/ media/ marketing/ auth/
  lib/                 env, supabase clients, validation (Zod), storage pipeline, fonts, QR
supabase/migrations/   schema · RLS · RPCs · storage
docs/SECURITY.md       every policy explained
```

## Templates

A template version is a JSON config (palette, fonts, motif, texture, opening
scene, animation, music) plus an ordered list of sections. Fifteen section
types (`hero`, `invitation`, `couple`, `bride`, `groom`, `family`, `countdown`,
`message`, `story`, `gallery`, `videos`, `events`, `venue`, `map`, `closing`),
each with layout variants; six opening scenes; six motif kits. Schema:
`src/lib/validation/template.ts`. Placeholders in section text:
`{{bride}} {{groom}} {{date}} {{time}} {{city}} {{venue}}`.

Publishing a version makes it immutable; weddings stay on their version until
the couple clicks "Update design".

## Demo media

Photos in `public/demo/photos` are from Unsplash (Unsplash License), resized to
WebP. The three music tracks in `public/demo/audio` and the demo film were
generated for this project and are royalty-free.

## What has and hasn't been verified

- ✅ Type-check, lint (warnings only), production build.
- ✅ Migrations, seed and RLS/RPC/storage policies against real Postgres (PGlite).
- ✅ All six templates rendered and exercised in headless Chrome (openings,
  music, lazy video, lightbox, language switch, reduced motion, no overflow).
- ⚠️ Not yet run against a live Supabase project: sign-up/login, uploads to
  Storage, signed URLs, and the edge function. Run through the customer and
  admin journeys once credentials are configured.
