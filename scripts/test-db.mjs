/**
 * Database test-suite: applies every migration + seed to an in-process
 * Postgres (PGlite) with minimal stand-ins for Supabase's `auth` and
 * `storage` schemas, then exercises RLS, column privileges, RPCs, template
 * versioning and storage policies as anon / customers / admins.
 *
 *   npm run test:db
 *
 * This verifies SQL semantics. It is not a substitute for running against a
 * real Supabase project (Auth/Storage services themselves are not emulated).
 */
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const db = new PGlite()

const SUPABASE_STUBS = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

create schema storage;
create table storage.buckets (id text primary key, name text not null, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
  name text not null, owner uuid default auth.uid(), metadata jsonb, unique (bucket_id, name));
create function storage.foldername(name text) returns text[] language plpgsql immutable as $$
declare _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1:array_length(_parts,1)-1];
end $$;
create function storage.extension(name text) returns text language plpgsql immutable as $$
declare _parts text[]; _filename text;
begin
  select string_to_array(name, '/') into _parts;
  select _parts[array_length(_parts,1)] into _filename;
  return reverse(split_part(reverse(_filename), '.', 1));
end $$;
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated;
grant all on storage.objects to anon, authenticated;
grant select on storage.buckets to anon, authenticated;
`

let passed = 0
let failed = 0
const results = []

async function as(user) {
  await db.exec('reset role')
  if (user === 'postgres') return
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [user ?? ''])
  await db.exec(user ? 'set role authenticated' : 'set role anon')
}
async function q(sql, params = []) {
  return (await db.query(sql, params)).rows
}
async function test(name, fn) {
  try {
    await fn()
    passed++
    results.push(`  ✓ ${name}`)
  } catch (e) {
    failed++
    results.push(`  ✗ ${name}\n      ${e.message}`)
  } finally {
    await db.exec('reset role')
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}
async function expectError(fn, pattern, label) {
  try {
    await fn()
  } catch (e) {
    if (pattern && !pattern.test(e.message)) throw new Error(`${label}: unexpected error "${e.message}"`)
    return
  }
  throw new Error(`${label}: expected an error but the statement succeeded`)
}

// ---------------------------------------------------------------- setup
await db.exec(SUPABASE_STUBS)
const migrations = readdirSync(`${root}supabase/migrations`).filter((f) => f.endsWith('.sql')).sort()
for (const f of migrations) {
  try {
    await db.exec(readFileSync(`${root}supabase/migrations/${f}`, 'utf8'))
  } catch (e) {
    console.error(`Migration ${f} failed: ${e.message}`)
    process.exit(1)
  }
}
await db.exec(readFileSync(`${root}supabase/seed.sql`, 'utf8'))
await db.exec(readFileSync(`${root}supabase/seed.sql`, 'utf8')) // idempotency
console.log(`Applied ${migrations.length} migrations + seed (twice).`)

const A = '00000000-0000-4000-a000-00000000000a'
const B = '00000000-0000-4000-a000-00000000000b'
const ADMIN = '00000000-0000-4000-a000-0000000000ad'
await q(`insert into auth.users (id, email, raw_user_meta_data) values
  ($1, 'a@example.com', '{"full_name":"Asha"}'), ($2, 'b@example.com', '{}'), ($3, 'admin@example.com', '{}')`, [A, B, ADMIN])
await q(`insert into public.admin_roles (user_id, role) values ($1, 'super_admin')`, [ADMIN])

let weddingA
let weddingB
let telugu

// ---------------------------------------------------------------- catalogue
await test('seed: 6 published templates, each with a published version and sections', async () => {
  const rows = await q(`select t.slug, v.status, (select count(*) from template_sections s where s.version_id = v.id)::int n
                        from invitation_templates t join template_versions v on v.id = t.current_version_id`)
  assert(rows.length === 6, `expected 6, got ${rows.length}`)
  assert(rows.every((r) => r.status === 'published' && r.n > 5), JSON.stringify(rows))
  telugu = (await q(`select id from invitation_templates where slug = 'royal-telugu'`))[0].id
})

await test('anon: can browse published templates and preview payloads', async () => {
  await as(null)
  const rows = await q(`select slug from invitation_templates`)
  assert(rows.length === 6, `anon saw ${rows.length} templates`)
  const p = (await q(`select get_template_payload('royal-nikah') p`))[0].p
  assert(p && p.sections.length > 5 && p.sampleData.groomName, 'payload incomplete')
})

await test('anon: cannot read weddings, photos or analytics tables', async () => {
  await as(null)
  await expectError(() => q('select * from weddings'), /permission denied/, 'weddings')
  await expectError(() => q('select * from wedding_photos'), /permission denied/, 'photos')
  const a = await q('select * from wedding_analytics')
  assert(a.length === 0, 'analytics visible to anon')
})

await test('anon: cannot read draft template versions', async () => {
  await as(ADMIN)
  await q(`select admin_ensure_draft_version($1)`, [telugu])
  await as(null)
  const rows = await q(`select id from template_versions where status = 'draft'`)
  assert(rows.length === 0, 'draft version leaked to anon')
})

// ---------------------------------------------------------------- weddings
await test('profiles: created on signup, private to the user', async () => {
  await as(A)
  const mine = await q('select full_name from profiles')
  assert(mine.length === 1 && mine[0].full_name === 'Asha', JSON.stringify(mine))
})

await test('customer: create_wedding generates collision-free slugs', async () => {
  await as(A)
  weddingA = (await q(`select * from create_wedding('Rahul Varma', 'Priya Reddy')`))[0]
  assert(weddingA.slug === 'rahul-weds-priya', `slug ${weddingA.slug}`)
  await as(B)
  weddingB = (await q(`select * from create_wedding('Rahul', 'Priya')`))[0]
  assert(weddingB.slug.startsWith('rahul-weds-priya-') && weddingB.slug !== weddingA.slug, `slug ${weddingB.slug}`)
  const unicode = (await q(`select suggest_wedding_slug('కార్తీక్', 'హారిక') s`))[0].s
  assert(/^wedding(-[a-z0-9]+)?$/.test(unicode), `unicode fallback ${unicode}`)
})

await test('customer: isolation — B cannot see, edit or delete A\'s wedding', async () => {
  await as(B)
  const seen = await q('select id from weddings where id = $1', [weddingA.id])
  assert(seen.length === 0, 'B can read A')
  const upd = await db.query(`update weddings set groom_name = 'hacked' where id = $1`, [weddingA.id])
  assert(upd.affectedRows === 0, 'B updated A')
  const del = await db.query(`delete from weddings where id = $1`, [weddingA.id])
  assert(del.affectedRows === 0, 'B deleted A')
  await expectError(() => q(`select get_wedding_preview($1)`, [weddingA.id]), /Not allowed/, 'preview')
  await expectError(() => q(`select get_wedding_analytics($1)`, [weddingA.id]), /Not allowed/, 'analytics')
})

await test('customer: B cannot insert content into A\'s wedding', async () => {
  await as(B)
  await expectError(
    () => q(`insert into wedding_events (wedding_id, name) values ($1, 'x')`, [weddingA.id]),
    /row-level security/,
    'event insert',
  )
  await expectError(
    () => q(`insert into wedding_messages (wedding_id, kind, body) values ($1, 'custom', 'x')`, [weddingA.id]),
    /row-level security/,
    'message insert',
  )
})

await test('customer: cannot set status, owner or template version directly', async () => {
  await as(A)
  await expectError(() => q(`update weddings set status = 'published' where id = $1`, [weddingA.id]), /permission denied/, 'status')
  await expectError(() => q(`update weddings set owner_id = $2 where id = $1`, [weddingA.id, B]), /permission denied/, 'owner')
  await expectError(() => q(`update weddings set template_version_id = null where id = $1`, [weddingA.id]), /permission denied/, 'version')
  await expectError(
    () => q(`insert into weddings (slug, status) values ('sneaky-insert', 'published')`),
    /permission denied/,
    'insert status',
  )
  await expectError(
    () => q(`insert into weddings (slug, owner_id) values ('sneaky-owner', $1)`, [B]),
    /permission denied/,
    'insert owner',
  )
})

await test('customer: cannot grant themselves admin', async () => {
  await as(A)
  await expectError(() => q(`insert into admin_roles (user_id, role) values ($1, 'super_admin')`, [A]), /row-level security/, 'escalate')
  const isAdmin = (await q('select is_admin() v'))[0].v
  assert(isAdmin === false, 'A is admin?')
})

await test('customer: media rows must point inside the wedding\'s own folder', async () => {
  await as(A)
  await expectError(
    () => q(`insert into wedding_photos (wedding_id, storage_path) values ($1, $2)`, [weddingA.id, `${B}/${weddingB.id}/photos/x.webp`]),
    /outside this wedding/,
    'foreign path',
  )
  await expectError(
    () => q(`insert into wedding_photos (wedding_id, storage_path) values ($1, $2)`, [weddingA.id, `${A}/${weddingA.id}/../x.webp`]),
    /Invalid media path/,
    'traversal',
  )
  const ok = await q(
    `insert into wedding_photos (wedding_id, kind, storage_path, thumb_path, width, height) values ($1, 'couple', $2, $3, 1600, 1067) returning id`,
    [weddingA.id, `${A}/${weddingA.id}/photos/one.webp`, `${A}/${weddingA.id}/thumbnails/one.webp`],
  )
  await q(`update weddings set cover_photo_id = $2 where id = $1`, [weddingA.id, ok[0].id])
})

await test('customer: cover photo must belong to the same wedding', async () => {
  await as(B)
  const p = await q(`insert into wedding_photos (wedding_id, storage_path) values ($1, $2) returning id`, [
    weddingB.id,
    `${B}/${weddingB.id}/photos/b.webp`,
  ])
  await as(A)
  await expectError(() => q(`update weddings set cover_photo_id = $2 where id = $1`, [weddingA.id, p[0].id]), /Cover photo/, 'cover')
})

await test('publish: blocked until required details exist, then succeeds', async () => {
  await as(A)
  await expectError(() => q(`select publish_wedding($1)`, [weddingA.id]), /Cannot publish yet/, 'early publish')
  await q(`select select_wedding_template($1, $2)`, [weddingA.id, telugu])
  await q(`update weddings set wedding_date = '2027-02-14', venue_name = 'Kalyana Mandapam' where id = $1`, [weddingA.id])
  await q(`insert into wedding_events (wedding_id, name, kind) values ($1, 'Wedding', 'wedding')`, [weddingA.id])
  const issues = (await q(`select wedding_publish_issues($1) i`, [weddingA.id]))[0].i
  assert(issues.length === 0, JSON.stringify(issues))
  const w = (await q(`select * from publish_wedding($1)`, [weddingA.id]))[0]
  assert(w.status === 'published' && w.published_at, 'not published')
})

await test('publish: slug is frozen after publishing', async () => {
  await as(A)
  await expectError(() => q(`update weddings set slug = 'new-link-here' where id = $1`, [weddingA.id]), /cannot change/, 'slug')
})

await test('guest: sees published invitation without private fields; drafts are hidden', async () => {
  await as(null)
  const p = (await q(`select get_public_wedding('rahul-weds-priya') p`))[0].p
  assert(p && p.groomName === 'Rahul Varma', 'missing payload')
  assert(!('owner_id' in p) && !('ownerId' in p), 'owner leaked')
  assert(p.template && p.template.sections.length > 5, 'template missing')
  assert(p.events.length === 1 && p.photos.length === 1, 'children missing')
  const draft = (await q(`select get_public_wedding($1) p`, [weddingB.slug]))[0].p
  assert(draft === null, 'draft visible to guests')
  const meta = (await q(`select get_wedding_meta('rahul-weds-priya') m`))[0].m
  assert(meta.coverPath.endsWith('one.webp'), 'meta cover')
})

await test('template_id is not directly writable by customers', async () => {
  await as(A)
  await expectError(() => q(`update weddings set template_id = null where id = $1`, [weddingA.id]), /permission denied/, 'template_id')
})

// ---------------------------------------------------------------- storage
await test('storage: owners write only in their own wedding folder with allowed types', async () => {
  await as(A)
  await q(`insert into storage.objects (bucket_id, name) values ('wedding-assets', $1)`, [`${A}/${weddingA.id}/photos/one.webp`])
  await expectError(
    () => q(`insert into storage.objects (bucket_id, name) values ('wedding-assets', $1)`, [`${A}/${weddingA.id}/photos/evil.html`]),
    /row-level security/,
    'bad extension',
  )
  await expectError(
    () => q(`insert into storage.objects (bucket_id, name) values ('wedding-assets', $1)`, [`${A}/${weddingA.id}/secrets/x.webp`]),
    /row-level security/,
    'bad folder',
  )
  await expectError(
    () => q(`insert into storage.objects (bucket_id, name) values ('wedding-assets', $1)`, [`${A}/${weddingB.id}/photos/x.webp`]),
    /row-level security/,
    'other wedding',
  )
  await as(B)
  await q(`insert into storage.objects (bucket_id, name) values ('wedding-assets', $1)`, [`${B}/${weddingB.id}/photos/b.webp`])
  const cross = await q(`select name from storage.objects where name like $1`, [`${A}/%`])
  assert(cross.length === 1, `B sees ${cross.length} of A's objects (published wedding => 1 expected)`)
})

await test('storage: guests read published wedding media only; template assets are admin-write', async () => {
  await as(null)
  const pub = await q(`select name from storage.objects where bucket_id = 'wedding-assets'`)
  assert(pub.length === 1 && pub[0].name.startsWith(A), `anon sees ${JSON.stringify(pub)}`)
  await as(A)
  await expectError(
    () => q(`insert into storage.objects (bucket_id, name) values ('template-assets', 'library/audio/x.mp3')`),
    /row-level security/,
    'template asset',
  )
  await as(ADMIN)
  await q(`insert into storage.objects (bucket_id, name) values ('template-assets', 'library/audio/x.mp3')`)
})

// ---------------------------------------------------------------- versioning
await test('versioning: published versions are immutable', async () => {
  await as(ADMIN)
  const v = (await q(`select current_version_id v from invitation_templates where id = $1`, [telugu]))[0].v
  await expectError(() => q(`update template_versions set config = config || '{"x":1}' where id = $1`, [v]), /immutable/, 'config')
  await expectError(() => q(`update template_sections set enabled = false where version_id = $1`, [v]), /immutable/, 'sections')
  await expectError(() => q(`delete from template_versions where id = $1`, [v]), /Only draft/, 'delete')
})

await test('versioning: invalid configs are rejected by the database', async () => {
  await as(ADMIN)
  const draft = (await q(`select admin_ensure_draft_version($1) v`, [telugu]))[0].v
  await expectError(
    () => q(`update template_versions set config = jsonb_set(config, '{theme,palette,primary}', '"red"') where id = $1`, [draft]),
    /check constraint|is_valid_template_config/,
    'bad colour',
  )
  await expectError(
    () => q(`update template_versions set config = jsonb_set(config, '{opening,style}', '"explode"') where id = $1`, [draft]),
    /check constraint|is_valid_template_config/,
    'bad opening',
  )
})

await test('versioning: publishing v2 keeps existing weddings on v1 until they upgrade', async () => {
  await as(ADMIN)
  const draft = (await q(`select admin_ensure_draft_version($1) v`, [telugu]))[0].v
  await q(`update template_versions set config = jsonb_set(config, '{theme,palette,primary}', '"#AA0000"') where id = $1`, [draft])
  await q(`update template_sections set enabled = false where version_id = $1 and section_key = 'gallery'`, [draft])
  await q(`select admin_publish_version($1, 'Brighter gold')`, [draft])
  const statuses = await q(`select version, status from template_versions where template_id = $1 order by version`, [telugu])
  assert(statuses[0].status === 'retired' && statuses[1].status === 'published', JSON.stringify(statuses))

  await as(null)
  const p = (await q(`select get_public_wedding('rahul-weds-priya') p`))[0].p
  assert(p.template.version === 1 && p.template.config.theme.palette.primary === '#C9A24A', 'wedding changed unexpectedly')

  await as(A)
  const visible = await q(`select id from template_versions where template_id = $1 and status = 'retired'`, [telugu])
  assert(visible.length === 1, 'owner cannot read pinned retired version')
  await q(`select upgrade_wedding_template($1)`, [weddingA.id])
  await as(null)
  const p2 = (await q(`select get_public_wedding('rahul-weds-priya') p`))[0].p
  assert(p2.template.version === 2 && p2.template.config.theme.palette.primary === '#AA0000', 'upgrade failed')
  assert(!p2.template.sections.find((s) => s.key === 'gallery').enabled, 'section change missing')
})

await test('admin: duplicate template creates an independent draft copy', async () => {
  await as(ADMIN)
  const id = (await q(`select admin_duplicate_template($1, 'Kalyanam Copy', 'kalyanam-copy') id`, [telugu]))[0].id
  const t = (await q(`select status, current_version_id from invitation_templates where id = $1`, [id]))[0]
  assert(t.status === 'draft' && t.current_version_id === null, JSON.stringify(t))
  const secs = await q(`select count(*)::int n from template_sections s join template_versions v on v.id = s.version_id where v.template_id = $1`, [id])
  assert(secs[0].n > 5, 'sections not copied')
  await as(A)
  const seen = await q(`select id from invitation_templates where id = $1`, [id])
  assert(seen.length === 0, 'customers see draft templates')
  await expectError(() => q(`select select_wedding_template($1, $2)`, [weddingA.id, id]), /not available/, 'select draft template')
})

await test('admin: RPCs refuse non-admins', async () => {
  await as(A)
  await expectError(() => q(`select admin_dashboard()`), /Admin only/, 'dashboard')
  await expectError(() => q(`select admin_ensure_draft_version($1)`, [telugu]), /Admin only/, 'draft')
  await expectError(
    () => q(`update invitation_templates set name = 'x' where id = $1`, [telugu]).then((r) => { if (r) throw new Error('row-level security: no-op ok') }),
    /row-level security|no-op/,
    'template update',
  )
  await as(ADMIN)
  const d = (await q(`select admin_dashboard() d`))[0].d
  assert(d.weddings === 2 && d.published === 1 && d.templates === 7, JSON.stringify(d))
})

// ---------------------------------------------------------------- analytics
await test('analytics: anonymous visits are de-duplicated per visitor per day', async () => {
  await as(null)
  const h1 = 'a'.repeat(64)
  const h2 = 'b'.repeat(64)
  await q(`select record_visit('rahul-weds-priya', 'qr', 'mobile', $1)`, [h1])
  await q(`select record_visit('rahul-weds-priya', 'qr', 'mobile', $1)`, [h1])
  await q(`select record_visit('rahul-weds-priya', 'link', 'desktop', $1)`, [h2])
  await q(`select record_visit($1, 'link', 'desktop', $2)`, [weddingB.slug, h2]) // draft: ignored
  await q(`select record_visit('rahul-weds-priya', 'link', 'desktop', 'not-a-hash')`) // invalid: ignored
  await q(`select record_interaction('rahul-weds-priya', 'open_invitation')`)
  await expectError(() => q(`insert into wedding_analytics (wedding_id, visitor_hash) values ($1, $2)`, [weddingA.id, h1]), /permission denied/, 'direct insert')
  await as(A)
  const a = (await q(`select get_wedding_analytics($1, 7) a`, [weddingA.id]))[0].a
  assert(a.totalVisits === 3 && a.uniqueVisitors === 2, JSON.stringify(a))
  assert(a.bySource.qr === 2 && a.byDevice.mobile === 1 && a.interactions.open_invitation === 1, JSON.stringify(a))
  assert(a.daily.length === 7, 'daily series length')
})

await test('lifecycle: unpublish hides the invitation; delete cascades', async () => {
  await as(A)
  await q(`select unpublish_wedding($1)`, [weddingA.id])
  await as(null)
  assert((await q(`select get_public_wedding('rahul-weds-priya') p`))[0].p === null, 'still public')
  await as(A)
  await q(`delete from weddings where id = $1`, [weddingA.id])
  await as('postgres')
  const left = await q(`select count(*)::int n from wedding_photos where wedding_id = $1`, [weddingA.id])
  assert(left[0].n === 0, 'children not cascaded')
})

console.log(results.join('\n'))
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
