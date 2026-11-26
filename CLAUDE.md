# CLAUDE.md — ShubhaVedhik

Indian digital wedding invitation SaaS. React 19 + TS + Vite 8 + Tailwind 4 +
Motion; Supabase is the only backend. See README.md for setup, docs/SECURITY.md
for the security model, PROJECT_PLAN.md for status.

## Commands

- `npm run dev` · `npm run build` (tsc + vite) · `npm run typecheck` · `npm run lint`
- `npm run test:db` — migrations + seed + 25 RLS/RPC tests on PGlite. Run after ANY SQL change.
- `npm run seed:generate` — rebuild `supabase/seed.sql` from presets. Run after editing presets or template/invitation schemas.
- `ANALYZE=1 npx vite build` — per-package chunks for bundle inspection.

## Architecture rules

- **Security lives in Postgres.** New tables need RLS + policies in a new
  migration, a test in `scripts/test-db.mjs`, and a row in docs/SECURITY.md.
  Never write `status`, `owner_id`, `template_id`, `template_version_id` on
  `weddings` from the client — use the RPCs. Never use the service-role key.
- **Migrations are append-only** once deployed. The four current files had never
  been applied when written; from now on add `2026MMDDhhmmss_*.sql`.
- **Template engine** (`src/features/invitation/engine/`): templates are data.
  New section type → add to `SECTION_TYPES`/`SECTION_VARIANTS`/`SECTION_LABELS`
  in `lib/validation/template.ts`, a component in `sections/`, the registry,
  and the CHECK list in `template_sections.type`. New layout = new `variant`
  branch in an existing section, never a per-wedding page.
- All invitation colours/fonts come from CSS vars (`--inv-*`, Tailwind
  `inv-*` tokens). Never hard-code template colours in section components.
- Faith-specific text goes through `sacred()`, other user/template text through `t()`.
- **Guest route budget:** `/w/:slug` and `/preview/*` must not import
  `@/lib/supabase/client` (supabase-js) or `AuthProvider`. Use
  `lib/supabase/rest.ts` + `features/invitation/publicApi.ts`. Howler, the
  lightbox and motion features are lazy. Check with `ANALYZE=1`.
- Use `m.*` (not `motion.*`) — `LazyMotion strict` throws otherwise.
- Shared modules imported by Node scripts (`lib/validation/*`,
  `features/templates/presets/*`) must use relative imports **with `.ts`
  extensions** and only `import type` for app types.
- Media: always go through `lib/storage/media.ts` (sniff → optimise) and
  `uploadWithProgress`; paths must be `{uid}/{weddingId}/{folder}/…` (DB trigger enforces).

## Code style

- Strict TS, no `any`. Zod for every external/user input. Business logic in
  `features/*/api.ts`, not components. TanStack Query for server state.
- UI copy: sentence case, plain verbs, consistent action names ("Publish" →
  "Published"). Errors say what happened and how to fix it.
- Design tokens: brand colours in `styles/index.css` `@theme` (paper, plum,
  kumkum, haldi, leaf…); display font Rozha One, body Mukta.
- Respect `prefers-reduced-motion`; animate transform/opacity only.
