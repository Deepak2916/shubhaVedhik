# ShubhaVedhik — Project Plan

Premium Indian digital wedding invitation platform. React + TypeScript + Vite + Tailwind v4 + Motion on the
frontend, Supabase (Postgres, Auth, Storage) as the only backend. One lightweight edge function at the
hosting layer injects social-preview metadata for `/w/:slug`.

## Starting state (inspected 2026-11-26)

- Vite React-TS scaffold with all required dependencies installed (`react@19`, `motion@14`, `zod@4`,
  `react-router-dom@7`, `@tanstack/react-query@5`, `@supabase/supabase-js@2`, `tailwindcss@4`, …).
- `src/App.tsx` was the Vite boilerplate and referenced assets that did not exist (build was broken).
- `supabase/migrations/…0001_schema.sql` and `…0002_rls.sql` existed but had never been applied.
  They are revised in place (not yet deployed anywhere), fixing: recursive `admin_roles` policy,
  `template_id` being directly writable by customers, unrestricted INSERT columns on `weddings`.
- Empty feature folders, no Supabase CLI, no credentials.

## Architecture decisions

| Concern | Decision |
|---|---|
| Template engine | Template **version** = JSONB config (theme, opening, animation, music) + ordered `template_sections` rows (type, enabled, position, JSONB config). One renderer (`InvitationRenderer`) maps section `type` → React component; `variant` picks the layout. No per-template pages. |
| Versioning | Published versions are immutable (DB trigger). Admin edits a draft version, publishes it; previous version is retired but still renders for weddings pinned to it. Customers explicitly “upgrade”. |
| Guest access | Guests never read tables. `get_public_wedding(slug)` (SECURITY DEFINER) returns a sanitised projection of a **published** wedding only. |
| Media privacy | Private bucket `wedding-assets/{uid}/{wedding}/…`. Owners read/write their folder; anon may create signed URLs only for objects under a published wedding. Template assets live in a public bucket. |
| Images | Optimised client-side before upload (WebP display ≤1600px + 640px thumb). Originals never served. Magic-byte sniffing, not extensions. |
| Video | MP4/WebM ≤150 MB, poster frame generated client-side, `preload="none"`, loaded only on play. |
| Music | Howler.js, started only from the “Open invitation” gesture (autoplay policy). Play/pause, mute, volume, reduced-motion aware. |
| Analytics | `record_visit` RPC: daily salted visitor hash (no IP/UA), source (`qr`/`link`), device class. |
| Social previews | Netlify Edge Function rewrites `<head>` of `/w/:slug` using `get_wedding_meta` (crawlers don't run JS). |
| Typing | Hand-written row types in `src/types/db.ts`; replace with `supabase gen types` when a project is linked. |

## Phases & tasks

### Phase 1 — Foundation
- [x] Inspect repo, plan
- [x] Tailwind v4 + design tokens, fonts, base UI kit
- [x] Router with lazy routes, layouts (marketing / dashboard / admin / invitation)
- [x] Env handling (`.env.example`), Supabase client

### Phase 2 — Database & auth
- [x] Schema, RLS, RPCs, storage buckets + policies (4 migrations)
- [x] Seed: categories, 6 templates (+ versions, sections, sample data), music library, settings
- [x] PGlite-based migration + RLS test suite (`npm run test:db`)
- [x] Auth: register, login, forgot/reset password, admin login with server-side role check

### Phase 3 — Admin console
- [x] Dashboard stats RPC + page
- [x] Template CRUD, status, featured, duplication, archive
- [x] Template builder: sections add/remove/reorder/toggle/configure; theme, fonts, opening, animation
- [x] Live preview with sample data, versions list, publish version
- [x] Categories, music library

### Phase 4 — Customer experience
- [x] Dashboard (multiple weddings), create wedding with collision-free slug
- [x] 9-step wizard: details, culture, template, photos, videos, music, events, messages, preview
- [x] Publish/unpublish with server-side validation, QR (PNG/SVG), share/copy, analytics

### Phase 5 — Invitation engine
- [x] Renderer, 15 section types with layout variants, 6 opening animations, 6 motif sets
- [x] Six distinct templates; `/w/:slug`; unavailable page; lightbox with swipe; lazy video; music player

### Phase 6 — Polish
- [x] Reduced motion, focus states, touch targets, meta tags, edge OG injection
- [x] Type-check, lint, production build, DB tests

## Verification status (2026-11-26)

| Check | Result |
|---|---|
| `npm run typecheck` / `npm run build` | pass |
| `npm run lint` | pass (warnings only: fast-refresh export hints, two set-state-in-effect) |
| `npm run test:db` (PGlite: migrations, seed ×2, RLS, column grants, RPCs, storage policies, versioning, analytics) | 25/25 pass |
| Headless Chrome: landing, template detail, all 6 templates (opening → full page, mobile + desktop) | no console errors, no horizontal overflow |
| Interactions: music from open gesture, lazy video (0 bytes before play) pauses music, lightbox + keys, language switch, reduced motion, unavailable page | pass |
| Guest route JS (gzip, static) | ~205 KB, no supabase-js; motion features, Howler, lightbox lazy |
| Live Supabase project (auth, storage uploads, signed URLs, edge function) | **not run** — no credentials available |

## Follow-ups
- Run the customer and admin journeys end-to-end against a real Supabase project.
- Optional: admin UI for granting admin roles and editing platform settings (SQL today).
- Optional: server-side video transcoding (uploads are size-limited, not re-encoded).

## Known external setup (see README.md)
Supabase project + env vars, apply migrations, run seed, grant first admin, configure auth redirect URLs,
deploy to Netlify (or any static host; OG injection is Netlify-specific).
