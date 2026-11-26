-- =====================================================================
-- ShubhaVedhik — core schema
-- Tables, constraints, indexes, timestamps and integrity triggers.
--   0002_rls.sql        Row Level Security policies + column privileges
--   0003_functions.sql  RPCs (public invitation, publishing, versioning, analytics)
--   0004_storage.sql    Storage buckets + storage policies
-- =====================================================================

-- gen_random_uuid() is built into Postgres 13+; no extensions required.

-- ---------- helpers ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- enums -----------------------------------------------------
create type public.wedding_status   as enum ('draft', 'published', 'unpublished');
create type public.template_status  as enum ('draft', 'published', 'archived');
create type public.version_status   as enum ('draft', 'published', 'retired');
create type public.admin_role       as enum ('admin', 'super_admin');
create type public.photo_kind       as enum ('bride', 'groom', 'couple', 'engagement', 'prewedding', 'family', 'other');
create type public.message_kind     as enum ('invitation', 'story', 'family', 'welcome', 'custom', 'blessings', 'thankyou');
create type public.visit_source     as enum ('qr', 'link', 'preview', 'other');
create type public.device_kind      as enum ('mobile', 'tablet', 'desktop', 'other');

-- ---------- profiles --------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  phone       text check (char_length(phone) <= 30),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'full_name', ''), 120))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- admin roles ----------------------------------------------
create table public.admin_roles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        public.admin_role not null default 'admin',
  granted_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_admin_roles_updated before update on public.admin_roles
  for each row execute function public.set_updated_at();

-- ---------- template config validation --------------------------------
-- Structural validation of a template version config. The frontend validates
-- the full shape with Zod (src/lib/validation/template.ts); the database
-- guarantees the parts the renderer cannot work without.
create or replace function public.is_valid_template_config(c jsonb)
returns boolean language plpgsql immutable as $$
declare k text;
begin
  if c is null or jsonb_typeof(c) <> 'object' then return false; end if;
  if jsonb_typeof(c->'theme') <> 'object'
     or jsonb_typeof(c->'theme'->'palette') <> 'object'
     or jsonb_typeof(c->'theme'->'fonts') <> 'object'
     or jsonb_typeof(c->'opening') <> 'object'
     or jsonb_typeof(c->'animation') <> 'object' then
    return false;
  end if;
  foreach k in array array['background','surface','text','muted','primary','accent'] loop
    if coalesce(c->'theme'->'palette'->>k, '') !~ '^#[0-9a-fA-F]{6}$' then return false; end if;
  end loop;
  if coalesce(c->'theme'->'fonts'->>'display', '') = '' or coalesce(c->'theme'->'fonts'->>'body', '') = '' then
    return false;
  end if;
  if coalesce(c->'theme'->>'motif', '') not in ('temple','geometric','floral','editorial','festive','film') then
    return false;
  end if;
  if coalesce(c->'opening'->>'style', '') not in ('temple-doors','mihrab','envelope','curtain','film-leader','editorial-split') then
    return false;
  end if;
  if coalesce(c->'animation'->>'preset', '') not in ('gentle','royal','cinematic','minimal') then
    return false;
  end if;
  return true;
end $$;

-- ---------- templates -------------------------------------------------
create table public.template_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (char_length(name) between 2 and 60),
  description text check (char_length(description) <= 400),
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_template_categories_updated before update on public.template_categories
  for each row execute function public.set_updated_at();

create table public.invitation_templates (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name                text not null check (char_length(name) between 2 and 80),
  tagline             text check (char_length(tagline) <= 160),
  description         text check (char_length(description) <= 1000),
  category_id         uuid references public.template_categories(id) on delete set null,
  cultural_tags       text[] not null default '{}',
  languages           text[] not null default '{en}',
  cover_image_url     text check (char_length(cover_image_url) <= 500),
  preview_images      text[] not null default '{}',
  supports_music      boolean not null default true,
  supports_video      boolean not null default true,
  supports_gallery    boolean not null default true,
  status              public.template_status not null default 'draft',
  is_featured         boolean not null default false,
  position            int not null default 0,
  -- Sample wedding content used for previews (same shape as the public
  -- invitation payload; see src/types/invitation.ts).
  sample_data         jsonb not null default '{}'::jsonb check (jsonb_typeof(sample_data) = 'object'),
  current_version_id  uuid,   -- FK added after template_versions exists
  created_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_templates_status on public.invitation_templates(status, position);
create index idx_templates_category on public.invitation_templates(category_id);
create trigger trg_templates_updated before update on public.invitation_templates
  for each row execute function public.set_updated_at();

-- A version holds the theme / opening / animation / music config and owns
-- its sections. Published versions are immutable (see trigger below) so
-- that weddings pinned to a version never change unexpectedly.
create table public.template_versions (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid not null references public.invitation_templates(id) on delete cascade,
  version      int not null check (version > 0),
  status       public.version_status not null default 'draft',
  config       jsonb not null check (public.is_valid_template_config(config)),
  changelog    text check (char_length(changelog) <= 1000),
  published_at timestamptz,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (template_id, version)
);
create index idx_template_versions_template on public.template_versions(template_id, version desc);
-- at most one editable draft per template
create unique index uq_template_versions_one_draft on public.template_versions(template_id) where status = 'draft';
create trigger trg_template_versions_updated before update on public.template_versions
  for each row execute function public.set_updated_at();

alter table public.invitation_templates
  add constraint fk_templates_current_version
  foreign key (current_version_id) references public.template_versions(id) on delete set null;

create table public.template_sections (
  id           uuid primary key default gen_random_uuid(),
  version_id   uuid not null references public.template_versions(id) on delete cascade,
  section_key  text not null check (section_key ~ '^[a-z0-9_-]{1,40}$'),
  type         text not null check (type in (
                 'hero','invitation','couple','bride','groom','family','countdown','message',
                 'story','gallery','videos','events','venue','map','closing')),
  position     int not null default 0,
  enabled      boolean not null default true,
  config       jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (version_id, section_key)
);
create index idx_template_sections_version on public.template_sections(version_id, position);
create trigger trg_template_sections_updated before update on public.template_sections
  for each row execute function public.set_updated_at();

-- Immutability of published / retired versions and their sections.
create or replace function public.guard_version_immutable()
returns trigger language plpgsql as $$
declare v_status public.version_status;
begin
  if tg_table_name = 'template_versions' then
    if old.status <> 'draft' then
      -- only allowed transition: published -> retired (status only)
      if not (old.status = 'published' and new.status = 'retired'
              and new.config = old.config and new.version = old.version) then
        raise exception 'Template version % is % and immutable', old.id, old.status
          using errcode = 'check_violation';
      end if;
    end if;
    return new;
  end if;
  -- template_sections: the parent version must be a draft. Deleting a whole
  -- version cascades here; allow that when the parent row is already gone.
  select status into v_status from public.template_versions
   where id = coalesce(new.version_id, old.version_id);
  if v_status is null and tg_op = 'DELETE' then
    return old;
  end if;
  if v_status is distinct from 'draft' then
    raise exception 'Sections of a % template version are immutable', v_status
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;
create trigger trg_versions_immutable before update on public.template_versions
  for each row execute function public.guard_version_immutable();
create trigger trg_sections_immutable before insert or update or delete on public.template_sections
  for each row execute function public.guard_version_immutable();

-- Published / retired versions may only be deleted together with their template.
create or replace function public.guard_version_delete()
returns trigger language plpgsql as $$
begin
  if old.status <> 'draft' and exists (select 1 from public.invitation_templates where id = old.template_id) then
    raise exception 'Only draft versions can be deleted' using errcode = 'check_violation';
  end if;
  return old;
end $$;
create trigger trg_versions_delete before delete on public.template_versions
  for each row execute function public.guard_version_delete();

-- Platform media library (music tracks, decorations, backgrounds).
-- Either a path in the public `template-assets` bucket or a bundled/static URL.
create table public.template_media (
  id           uuid primary key default gen_random_uuid(),
  template_id  uuid references public.invitation_templates(id) on delete cascade, -- null = platform library
  kind         text not null check (kind in ('preview','background','decoration','audio')),
  title        text check (char_length(title) <= 120),
  description  text check (char_length(description) <= 300),
  storage_path text unique,
  public_url   text check (char_length(public_url) <= 500),
  mime_type    text not null,
  size_bytes   bigint check (size_bytes is null or size_bytes > 0),
  meta         jsonb not null default '{}'::jsonb,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (storage_path is not null or public_url is not null)
);
create index idx_template_media_template on public.template_media(template_id, kind);
create trigger trg_template_media_updated before update on public.template_media
  for each row execute function public.set_updated_at();

-- ---------- weddings --------------------------------------------------
create table public.weddings (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null default auth.uid() references auth.users(id) on delete cascade,
  slug                text not null unique
                        check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  status              public.wedding_status not null default 'draft',
  template_id         uuid references public.invitation_templates(id) on delete set null,
  template_version_id uuid references public.template_versions(id) on delete restrict,

  groom_name          text not null default '' check (char_length(groom_name) <= 80),
  bride_name          text not null default '' check (char_length(bride_name) <= 80),
  groom_parents       text check (char_length(groom_parents) <= 200),
  bride_parents       text check (char_length(bride_parents) <= 200),
  wedding_date        date,
  wedding_time        time,
  city                text check (char_length(city) <= 120),
  venue_name          text check (char_length(venue_name) <= 160),
  venue_address       text check (char_length(venue_address) <= 400),
  maps_url            text check (maps_url is null or (maps_url ~ '^https://' and char_length(maps_url) <= 500)),
  couple_intro        text check (char_length(couple_intro) <= 2000),
  invitation_message  text check (char_length(invitation_message) <= 2000),

  religion            text check (religion in ('hindu','muslim','christian','sikh','jain','buddhist','interfaith','other')),
  primary_language    text not null default 'en' check (primary_language ~ '^[a-z]{2}$'),
  languages           text[] not null default '{en}',
  traditions          text[] not null default '{}',
  -- e.g. {"te": {"groomName": "రాహుల్", "brideName": "ప్రియ", "headline": "శుభ వివాహ ఆహ్వానం"}}
  localized           jsonb not null default '{}'::jsonb check (jsonb_typeof(localized) = 'object'),

  theme_overrides     jsonb not null default '{}'::jsonb check (jsonb_typeof(theme_overrides) = 'object'),
  music_settings      jsonb not null default '{"volume":0.6,"autoplay":true,"startOn":"open"}'::jsonb
                        check (jsonb_typeof(music_settings) = 'object'),
  cover_photo_id      uuid,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_weddings_owner on public.weddings(owner_id, created_at desc);
create index idx_weddings_status on public.weddings(status);
create index idx_weddings_template on public.weddings(template_id);
create index idx_weddings_version on public.weddings(template_version_id);
create trigger trg_weddings_updated before update on public.weddings
  for each row execute function public.set_updated_at();

-- Media / content tables — all cascade with the wedding.
create table public.wedding_photos (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings(id) on delete cascade,
  kind         public.photo_kind not null default 'couple',
  storage_path text not null unique,        -- optimised display version (webp)
  thumb_path   text,                        -- small version for grids
  width        int check (width is null or width between 1 and 10000),
  height       int check (height is null or height between 1 and 10000),
  caption      text check (char_length(caption) <= 300),
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_wedding_photos_wedding on public.wedding_photos(wedding_id, position);
create trigger trg_wedding_photos_updated before update on public.wedding_photos
  for each row execute function public.set_updated_at();

alter table public.weddings add constraint fk_weddings_cover_photo
  foreign key (cover_photo_id) references public.wedding_photos(id) on delete set null;

-- Integrity rules a customer must not be able to bypass:
--  * owner_id never changes
--  * slug is frozen once the invitation has been published (QR codes in the wild)
--  * cover photo must belong to this wedding
create or replace function public.guard_wedding_update()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if new.owner_id is distinct from old.owner_id then
      raise exception 'owner_id is immutable' using errcode = 'check_violation';
    end if;
    if new.slug is distinct from old.slug and (old.status <> 'draft' or old.published_at is not null) then
      raise exception 'The invitation link cannot change after publishing' using errcode = 'check_violation';
    end if;
  end if;
  if new.cover_photo_id is not null and not exists (
       select 1 from public.wedding_photos p where p.id = new.cover_photo_id and p.wedding_id = new.id) then
    raise exception 'Cover photo must belong to this wedding' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger trg_weddings_guard before insert or update on public.weddings
  for each row execute function public.guard_wedding_update();

create table public.wedding_videos (
  id             uuid primary key default gen_random_uuid(),
  wedding_id     uuid not null references public.weddings(id) on delete cascade,
  storage_path   text not null unique,
  thumbnail_path text,
  mime_type      text not null check (mime_type in ('video/mp4','video/webm')),
  size_bytes     bigint not null check (size_bytes > 0 and size_bytes <= 157286400),
  duration_s     numeric check (duration_s is null or duration_s >= 0),
  title          text check (char_length(title) <= 120),
  description    text check (char_length(description) <= 600),
  position       int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_wedding_videos_wedding on public.wedding_videos(wedding_id, position);
create trigger trg_wedding_videos_updated before update on public.wedding_videos
  for each row execute function public.set_updated_at();

create table public.wedding_audio (
  id               uuid primary key default gen_random_uuid(),
  wedding_id       uuid not null references public.weddings(id) on delete cascade,
  storage_path     text unique,                                         -- customer upload
  library_media_id uuid references public.template_media(id) on delete cascade, -- platform track
  title            text check (char_length(title) <= 120),
  mime_type        text check (mime_type is null or mime_type in ('audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/webm')),
  size_bytes       bigint check (size_bytes is null or size_bytes <= 20971520),
  is_active        boolean not null default false,
  position         int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check ((storage_path is not null) <> (library_media_id is not null))
);
create index idx_wedding_audio_wedding on public.wedding_audio(wedding_id);
create unique index uq_wedding_audio_active on public.wedding_audio(wedding_id) where is_active;
create trigger trg_wedding_audio_updated before update on public.wedding_audio
  for each row execute function public.set_updated_at();

create table public.wedding_events (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  kind         text not null default 'other' check (kind ~ '^[a-z_]{1,40}$'),
  description  text check (char_length(description) <= 1000),
  event_date   date,
  start_time   time,
  end_time     time,
  venue_name   text check (char_length(venue_name) <= 160),
  address      text check (char_length(address) <= 400),
  maps_url     text check (maps_url is null or (maps_url ~ '^https://' and char_length(maps_url) <= 500)),
  dress_code   text check (char_length(dress_code) <= 120),
  image_path   text,
  icon         text check (char_length(icon) <= 40),
  position     int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_wedding_events_wedding on public.wedding_events(wedding_id, position);
create trigger trg_wedding_events_updated before update on public.wedding_events
  for each row execute function public.set_updated_at();

create table public.wedding_messages (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  kind        public.message_kind not null,
  language    text not null default 'en' check (language ~ '^[a-z]{2}$'),
  title       text check (char_length(title) <= 160),
  body        text not null check (char_length(body) between 1 and 5000),
  meta        jsonb not null default '{}'::jsonb check (jsonb_typeof(meta) = 'object'), -- story milestone {date, photoId}
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_wedding_messages_wedding on public.wedding_messages(wedding_id, kind, position);
create trigger trg_wedding_messages_updated before update on public.wedding_messages
  for each row execute function public.set_updated_at();

-- Storage paths written by customers must live in the wedding's own folder:
--   {owner_id}/{wedding_id}/...
-- Prevents referencing another customer's objects from your own rows.
create or replace function public.guard_media_path()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_prefix text;
  v_row jsonb := to_jsonb(new);
  k text;
begin
  select owner_id::text || '/' || id::text || '/' into v_prefix from public.weddings where id = new.wedding_id;
  foreach k in array array['storage_path','thumb_path','thumbnail_path','image_path'] loop
    if v_row ? k and v_row->>k is not null and left(v_row->>k, char_length(v_prefix)) <> v_prefix then
      raise exception 'Media path % is outside this wedding''s folder', k using errcode = 'check_violation';
    end if;
    if v_row ? k and v_row->>k like '%..%' then
      raise exception 'Invalid media path' using errcode = 'check_violation';
    end if;
  end loop;
  return new;
end $$;
create trigger trg_photos_path before insert or update on public.wedding_photos
  for each row execute function public.guard_media_path();
create trigger trg_videos_path before insert or update on public.wedding_videos
  for each row execute function public.guard_media_path();
create trigger trg_audio_path before insert or update on public.wedding_audio
  for each row execute function public.guard_media_path();
create trigger trg_events_path before insert or update on public.wedding_events
  for each row execute function public.guard_media_path();

-- ---------- analytics (privacy-conscious; no IP, no UA string) --------
-- One row per (wedding, day, anonymous visitor). `hits` counts repeat opens.
create table public.wedding_analytics (
  id           bigint generated always as identity primary key,
  wedding_id   uuid not null references public.weddings(id) on delete cascade,
  visited_on   date not null default current_date,
  source       public.visit_source not null default 'link',
  device       public.device_kind not null default 'other',
  visitor_hash text not null check (visitor_hash ~ '^[0-9a-f]{64}$'),
  hits         int not null default 1 check (hits > 0),
  created_at   timestamptz not null default now(),
  unique (wedding_id, visited_on, visitor_hash)
);
create index idx_wedding_analytics_wedding_day on public.wedding_analytics(wedding_id, visited_on);

create table public.wedding_guest_interactions (
  id          bigint generated always as identity primary key,
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  action      text not null check (action in ('open_invitation','play_music','play_video','open_map','view_gallery','share')),
  created_at  timestamptz not null default now()
);
create index idx_guest_interactions_wedding on public.wedding_guest_interactions(wedding_id, action);

-- ---------- platform settings ----------------------------------------
create table public.platform_settings (
  key         text primary key check (key ~ '^[a-z0-9_.]{1,60}$'),
  value       jsonb not null,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_platform_settings_updated before update on public.platform_settings
  for each row execute function public.set_updated_at();
