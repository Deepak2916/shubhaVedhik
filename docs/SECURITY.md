# Security model

Everything is enforced in Postgres. The browser only ever holds the public
**anon key** plus the user's session JWT; frontend role checks (`RequireAdmin`,
hidden buttons) are convenience only. Verified by `npm run test:db` (25 tests).

## Roles

| Who | How identified | Can do |
|---|---|---|
| Guest | `anon` role, no session | Read published template catalogue; call `get_public_wedding`, `get_wedding_meta`, `get_template_payload`, `record_visit`, `record_interaction`; sign URLs for media of **published** weddings |
| Customer | `authenticated`, `auth.uid()` | Full CRUD on **own** weddings and their content; nothing else |
| Admin | row in `admin_roles` (checked by `is_admin()`, SECURITY DEFINER) | Manage templates, versions, sections, categories, media library, settings; read all weddings |
| Super admin | `admin_roles.role = 'super_admin'` | Additionally grant/revoke admin roles (never their own) |

The first super admin is created with `scripts/grant-admin.sql` in the SQL editor
— there is no self-service bootstrap path that could be raced.

## Table policies (`supabase/migrations/…0002_rls.sql`)

| Table | Read | Write |
|---|---|---|
| `profiles` | self, admins | self; only `full_name`, `phone` columns |
| `admin_roles` | own row, admins | super admins only; cannot delete own row |
| `template_categories` | everyone | admins |
| `invitation_templates` | `status='published'`, admins, or customers whose wedding uses it | admins |
| `template_versions` | `published`, admins, or the customer whose wedding is pinned to it (retired versions) | admins; published/retired rows immutable (trigger) |
| `template_sections` | follows version visibility | admins; immutable unless parent version is `draft` |
| `template_media` | active rows, admins | admins |
| `weddings` | owner, admins. **No anon access at all** | owner. INSERT/UPDATE limited by column grants — `status`, `published_at`, `owner_id`, `template_id`, `template_version_id` are not writable; they change only via RPCs |
| `wedding_photos/videos/audio/events/messages` | owner, admins | owner (`owns_wedding()`); no anon privileges |
| `wedding_analytics`, `wedding_guest_interactions` | owner, admins | nobody directly — only `record_visit` / `record_interaction` |
| `platform_settings` | `is_public` rows, admins | admins |

Helper predicates (`is_admin`, `is_super_admin`, `owns_wedding`, `uses_template`,
`uses_template_version`) are `SECURITY DEFINER` with a pinned `search_path`, so
policies never recurse and anon never needs privileges on `weddings`.

## Integrity triggers (`…0001_schema.sql`)

- `guard_wedding_update` — `owner_id` immutable; slug frozen once published
  (printed QR codes keep working); cover photo must belong to the same wedding.
- `guard_media_path` — every `storage_path`/`thumb_path`/`image_path` must start
  with `{owner_id}/{wedding_id}/` and contain no `..`. A customer cannot point a
  row at someone else's object.
- `guard_version_immutable` / `guard_version_delete` — published versions and
  their sections cannot change or be deleted (only `published → retired`).
- `is_valid_template_config` CHECK — template JSON must contain a valid palette
  (hex colours), fonts, motif, opening style and animation preset.

## RPCs (`…0003_functions.sql`)

All `SECURITY DEFINER` functions authorise first:
`publish_wedding` / `unpublish_wedding` / `select_wedding_template` /
`upgrade_wedding_template` / `get_wedding_preview` / `get_wedding_analytics`
check `owns_wedding()`; every `admin_*` function calls `assert_admin()`.
`publish_wedding` re-validates required fields server-side.
`get_public_wedding` returns only published weddings and a sanitised projection
(no `owner_id`, no profile data). `build_wedding_payload` is not executable by
API roles.

## Storage (`…0004_storage.sql`)

- `wedding-assets` — **private**, 150 MB limit, MIME allow-list.
  Path `{uid}/{wedding_id}/{photos|thumbnails|videos|audio|events}/{file}`.
  Owners read/write only their own wedding folders with allowed extensions per
  sub-folder. Guests (anon) can create signed URLs **only** for objects whose
  wedding is published. Drafts are never reachable without the owner's session.
- `template-assets` — public read (design assets), admin-only write.
- Client additionally sniffs magic bytes (`src/lib/storage/media.ts`) and
  re-encodes images (stripping EXIF/GPS) before upload.

## Analytics & privacy

No IP addresses, user agents or cookies are stored. `record_visit` receives a
SHA-256 of `slug + random id kept in the guest's localStorage`, the source
(`qr`/`link`), and a coarse device class. One row per visitor per day;
repeat opens increment a capped counter.

## Secrets

- `VITE_*` variables are public by design — only the URL and anon key.
- The service-role key is not used anywhere in this repository.
- The Netlify edge function uses the anon key only.

## Known limits / operator checklist

- Enable email confirmation and configure redirect URLs in Supabase Auth.
- Consider Supabase Auth rate limits and CAPTCHA for sign-up in production.
- `record_interaction` caps rows per wedding per day; `record_visit` dedupes per
  visitor per day. Add an API gateway rate limit if abuse appears.
- Objects under a published wedding folder that are no longer referenced by any
  row remain signable until deleted; the app deletes objects when rows are
  removed and when a wedding is deleted.
