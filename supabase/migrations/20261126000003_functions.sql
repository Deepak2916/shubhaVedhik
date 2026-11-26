-- =====================================================================
-- RPCs. Every SECURITY DEFINER function pins search_path and performs its
-- own authorisation check before touching data.
-- =====================================================================

-- ---------- slugs -----------------------------------------------------
create or replace function public.slugify(p text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- Returns a slug that is free right now. Visible to anyone: slugs of
-- published invitations are public anyway and nothing else is revealed.
create or replace function public.suggest_wedding_slug(p_groom text, p_bride text, p_preferred text default null)
returns text language plpgsql stable security definer set search_path = public as $$
declare
  v_base text;
  v_try  text;
  i int := 0;
begin
  v_base := public.slugify(p_preferred);
  if char_length(v_base) < 3 then
    v_base := public.slugify(split_part(trim(coalesce(p_groom,'')), ' ', 1) || ' weds ' || split_part(trim(coalesce(p_bride,'')), ' ', 1));
  end if;
  if char_length(v_base) < 3 or v_base = 'weds' then
    v_base := 'wedding';
  end if;
  v_base := left(v_base, 50);
  v_try := v_base;
  while exists (select 1 from public.weddings where slug = v_try) or v_try in ('new','edit','admin','preview') loop
    i := i + 1;
    v_try := v_base || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
    if i > 20 then raise exception 'Could not allocate a unique slug'; end if;
  end loop;
  return v_try;
end $$;
grant execute on function public.suggest_wedding_slug(text, text, text) to anon, authenticated;

create or replace function public.is_slug_available(p_slug text, p_wedding uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(p_slug) between 3 and 60
     and p_slug not in ('new','edit','admin','preview')
     and not exists (select 1 from public.weddings where slug = p_slug and id is distinct from p_wedding);
$$;
grant execute on function public.is_slug_available(text, uuid) to authenticated;

-- ---------- wedding lifecycle ---------------------------------------
create or replace function public.create_wedding(p_groom text, p_bride text, p_template uuid default null)
returns public.weddings language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_row public.weddings;
  v_version uuid;
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if (select count(*) from public.weddings where owner_id = v_uid) >= 50 then
    raise exception 'Wedding limit reached for this account' using errcode = 'check_violation';
  end if;
  if p_template is not null then
    select current_version_id into v_version from public.invitation_templates
     where id = p_template and status = 'published' and current_version_id is not null;
    if v_version is null then raise exception 'Template is not available'; end if;
  end if;
  insert into public.weddings (owner_id, slug, groom_name, bride_name, template_id, template_version_id)
  values (v_uid, public.suggest_wedding_slug(p_groom, p_bride),
          left(trim(coalesce(p_groom, '')), 80), left(trim(coalesce(p_bride, '')), 80),
          case when v_version is null then null else p_template end, v_version)
  returning * into v_row;
  return v_row;
end $$;
grant execute on function public.create_wedding(text, text, uuid) to authenticated;

create or replace function public.select_wedding_template(p_wedding uuid, p_template uuid)
returns public.weddings language plpgsql security definer set search_path = public as $$
declare
  v_version uuid;
  v_row public.weddings;
begin
  if not public.owns_wedding(p_wedding) then raise exception 'Not allowed' using errcode = '42501'; end if;
  select current_version_id into v_version from public.invitation_templates
   where id = p_template and status = 'published' and current_version_id is not null;
  if v_version is null then raise exception 'Template is not available'; end if;
  update public.weddings set template_id = p_template, template_version_id = v_version
   where id = p_wedding returning * into v_row;
  return v_row;
end $$;
grant execute on function public.select_wedding_template(uuid, uuid) to authenticated;

-- Move a wedding to the latest published version of its template.
create or replace function public.upgrade_wedding_template(p_wedding uuid)
returns public.weddings language plpgsql security definer set search_path = public as $$
declare v_row public.weddings;
begin
  if not public.owns_wedding(p_wedding) then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.weddings w set template_version_id = t.current_version_id
    from public.invitation_templates t
   where w.id = p_wedding and t.id = w.template_id and t.current_version_id is not null
  returning w.* into v_row;
  if v_row.id is null then raise exception 'No newer template version available'; end if;
  return v_row;
end $$;
grant execute on function public.upgrade_wedding_template(uuid) to authenticated;

-- Server-side publish validation. Returns the list of missing items.
create or replace function public.wedding_publish_issues(p_wedding uuid)
returns text[] language plpgsql stable security definer set search_path = public as $$
declare
  w public.weddings;
  issues text[] := '{}';
begin
  select * into w from public.weddings where id = p_wedding;
  if w.id is null then return array['Wedding not found']; end if;
  if w.owner_id <> auth.uid() and not public.is_admin() then return array['Not allowed']; end if;
  if char_length(trim(w.groom_name)) = 0 then issues := array_append(issues, 'Add the groom''s name'); end if;
  if char_length(trim(w.bride_name)) = 0 then issues := array_append(issues, 'Add the bride''s name'); end if;
  if w.wedding_date is null then issues := array_append(issues, 'Add the wedding date'); end if;
  if coalesce(trim(w.venue_name), '') = '' then issues := array_append(issues, 'Add the venue name'); end if;
  if w.template_version_id is null then issues := array_append(issues, 'Choose a template'); end if;
  return issues;
end $$;
grant execute on function public.wedding_publish_issues(uuid) to authenticated;

create or replace function public.publish_wedding(p_wedding uuid)
returns public.weddings language plpgsql security definer set search_path = public as $$
declare
  v_issues text[];
  v_row public.weddings;
begin
  if not public.owns_wedding(p_wedding) then raise exception 'Not allowed' using errcode = '42501'; end if;
  v_issues := public.wedding_publish_issues(p_wedding);
  if cardinality(v_issues) > 0 then
    raise exception 'Cannot publish yet: %', array_to_string(v_issues, '; ') using errcode = 'check_violation';
  end if;
  update public.weddings set status = 'published', published_at = coalesce(published_at, now())
   where id = p_wedding returning * into v_row;
  return v_row;
end $$;
grant execute on function public.publish_wedding(uuid) to authenticated;

create or replace function public.unpublish_wedding(p_wedding uuid)
returns public.weddings language plpgsql security definer set search_path = public as $$
declare v_row public.weddings;
begin
  if not public.owns_wedding(p_wedding) then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.weddings set status = 'unpublished' where id = p_wedding returning * into v_row;
  return v_row;
end $$;
grant execute on function public.unpublish_wedding(uuid) to authenticated;

-- ---------- invitation payload --------------------------------------
-- Sanitised projection used by the renderer. Never includes owner_id or any
-- profile data. Media are returned as storage paths; the client converts
-- them to signed URLs (storage policy allows that only for published
-- weddings or the owner).
create or replace function public.build_wedding_payload(p_wedding uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', w.id,
    'slug', w.slug,
    'status', w.status,
    'groomName', w.groom_name,
    'brideName', w.bride_name,
    'groomParents', w.groom_parents,
    'brideParents', w.bride_parents,
    'date', w.wedding_date,
    'time', to_char(w.wedding_time, 'HH24:MI'),
    'city', w.city,
    'venueName', w.venue_name,
    'venueAddress', w.venue_address,
    'mapsUrl', w.maps_url,
    'coupleIntro', w.couple_intro,
    'invitationMessage', w.invitation_message,
    'religion', w.religion,
    'primaryLanguage', w.primary_language,
    'languages', to_jsonb(w.languages),
    'traditions', to_jsonb(w.traditions),
    'localized', w.localized,
    'themeOverrides', w.theme_overrides,
    'musicSettings', w.music_settings,
    'coverPhotoId', w.cover_photo_id,
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'kind', p.kind, 'path', p.storage_path, 'thumbPath', p.thumb_path,
                                          'width', p.width, 'height', p.height, 'caption', p.caption)
                       order by p.position, p.created_at)
        from public.wedding_photos p where p.wedding_id = w.id), '[]'::jsonb),
    'videos', coalesce((
      select jsonb_agg(jsonb_build_object('id', v.id, 'path', v.storage_path, 'posterPath', v.thumbnail_path,
                                          'mimeType', v.mime_type, 'title', v.title, 'description', v.description,
                                          'durationS', v.duration_s)
                       order by v.position, v.created_at)
        from public.wedding_videos v where v.wedding_id = w.id), '[]'::jsonb),
    'audio', (
      select jsonb_build_object('title', coalesce(a.title, m.title), 'path', a.storage_path,
                                'libraryPath', m.storage_path, 'libraryUrl', m.public_url)
        from public.wedding_audio a left join public.template_media m on m.id = a.library_media_id
       where a.wedding_id = w.id and a.is_active limit 1),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'name', e.name, 'kind', e.kind, 'description', e.description,
                                          'date', e.event_date, 'startTime', to_char(e.start_time, 'HH24:MI'),
                                          'endTime', to_char(e.end_time, 'HH24:MI'), 'venueName', e.venue_name,
                                          'address', e.address, 'mapsUrl', e.maps_url, 'dressCode', e.dress_code,
                                          'imagePath', e.image_path, 'icon', e.icon)
                       order by e.position, e.event_date nulls last, e.start_time nulls last)
        from public.wedding_events e where e.wedding_id = w.id), '[]'::jsonb),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'kind', m.kind, 'language', m.language, 'title', m.title,
                                          'body', m.body, 'meta', m.meta)
                       order by m.kind, m.position, m.created_at)
        from public.wedding_messages m where m.wedding_id = w.id), '[]'::jsonb),
    'template', (
      select jsonb_build_object(
        'id', t.id, 'slug', t.slug, 'name', t.name, 'versionId', v.id, 'version', v.version, 'config', v.config,
        'sections', coalesce((
          select jsonb_agg(jsonb_build_object('key', s.section_key, 'type', s.type, 'enabled', s.enabled,
                                              'position', s.position, 'config', s.config) order by s.position)
            from public.template_sections s where s.version_id = v.id), '[]'::jsonb))
        from public.template_versions v join public.invitation_templates t on t.id = v.template_id
       where v.id = w.template_version_id)
  )
  from public.weddings w where w.id = p_wedding;
$$;
revoke all on function public.build_wedding_payload(uuid) from public, anon, authenticated;

-- Guests: published weddings only.
create or replace function public.get_public_wedding(p_slug text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from public.weddings where slug = lower(p_slug) and status = 'published';
  if v_id is null then return null; end if;
  return public.build_wedding_payload(v_id);
end $$;
grant execute on function public.get_public_wedding(text) to anon, authenticated;

-- Owners/admins: any status (draft preview).
create or replace function public.get_wedding_preview(p_wedding uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.owns_wedding(p_wedding) or public.is_admin()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return public.build_wedding_payload(p_wedding);
end $$;
grant execute on function public.get_wedding_preview(uuid) to authenticated;

-- Social preview metadata (used by the edge function that rewrites <head>).
create or replace function public.get_wedding_meta(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'slug', w.slug,
    'groomName', w.groom_name,
    'brideName', w.bride_name,
    'date', w.wedding_date,
    'city', w.city,
    'venueName', w.venue_name,
    'coverPath', coalesce(cp.storage_path, (select p.storage_path from public.wedding_photos p
                                              where p.wedding_id = w.id order by p.position limit 1)),
    'templateCover', t.cover_image_url)
  from public.weddings w
  left join public.wedding_photos cp on cp.id = w.cover_photo_id
  left join public.invitation_templates t on t.id = w.template_id
  where w.slug = lower(p_slug) and w.status = 'published';
$$;
grant execute on function public.get_wedding_meta(text) to anon, authenticated;

-- Template preview payload (sample data + current or given version).
-- SECURITY INVOKER: RLS decides which templates/versions are visible.
create or replace function public.get_template_payload(p_slug text, p_version uuid default null)
returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'id', t.id, 'slug', t.slug, 'name', t.name, 'versionId', v.id, 'version', v.version,
    'versionStatus', v.status, 'config', v.config, 'sampleData', t.sample_data,
    'sections', coalesce((
      select jsonb_agg(jsonb_build_object('key', s.section_key, 'type', s.type, 'enabled', s.enabled,
                                          'position', s.position, 'config', s.config) order by s.position)
        from public.template_sections s where s.version_id = v.id), '[]'::jsonb))
  from public.invitation_templates t
  join public.template_versions v on v.id = coalesce(p_version, t.current_version_id) and v.template_id = t.id
  where t.slug = p_slug;
$$;
grant execute on function public.get_template_payload(text, uuid) to anon, authenticated;

-- ---------- analytics ------------------------------------------------
create or replace function public.record_visit(p_slug text, p_source text, p_device text, p_visitor_hash text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from public.weddings where slug = lower(p_slug) and status = 'published';
  if v_id is null or p_visitor_hash !~ '^[0-9a-f]{64}$' then return; end if;
  insert into public.wedding_analytics (wedding_id, source, device, visitor_hash)
  values (v_id,
          case when p_source in ('qr','link','preview','other') then p_source::public.visit_source else 'other' end,
          case when p_device in ('mobile','tablet','desktop','other') then p_device::public.device_kind else 'other' end,
          p_visitor_hash)
  on conflict (wedding_id, visited_on, visitor_hash)
  do update set hits = least(public.wedding_analytics.hits + 1, 500);
end $$;
grant execute on function public.record_visit(text, text, text, text) to anon, authenticated;

create or replace function public.record_interaction(p_slug text, p_action text)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_id uuid;
begin
  if p_action not in ('open_invitation','play_music','play_video','open_map','view_gallery','share') then return; end if;
  select id into v_id from public.weddings where slug = lower(p_slug) and status = 'published';
  if v_id is null then return; end if;
  -- crude abuse guard: cap rows per wedding per day
  if (select count(*) from public.wedding_guest_interactions
       where wedding_id = v_id and created_at > now() - interval '1 day') >= 20000 then
    return;
  end if;
  insert into public.wedding_guest_interactions (wedding_id, action) values (v_id, p_action);
end $$;
grant execute on function public.record_interaction(text, text) to anon, authenticated;

create or replace function public.get_wedding_analytics(p_wedding uuid, p_days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_from date := current_date - greatest(1, least(coalesce(p_days, 30), 365)) + 1;
begin
  if not (public.owns_wedding(p_wedding) or public.is_admin()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'totalVisits', (select coalesce(sum(hits), 0) from public.wedding_analytics where wedding_id = p_wedding),
    'uniqueVisitors', (select count(distinct visitor_hash) from public.wedding_analytics where wedding_id = p_wedding),
    'bySource', coalesce((select jsonb_object_agg(source, n) from (
        select source, sum(hits) n from public.wedding_analytics where wedding_id = p_wedding group by source) s), '{}'::jsonb),
    'byDevice', coalesce((select jsonb_object_agg(device, n) from (
        select device, count(*) n from public.wedding_analytics where wedding_id = p_wedding group by device) d), '{}'::jsonb),
    'interactions', coalesce((select jsonb_object_agg(action, n) from (
        select action, count(*) n from public.wedding_guest_interactions where wedding_id = p_wedding group by action) i), '{}'::jsonb),
    'daily', (select jsonb_agg(jsonb_build_object('day', d::date, 'visits', coalesce(x.visits, 0), 'unique', coalesce(x.uniq, 0)) order by d)
                from generate_series(v_from, current_date, interval '1 day') d
                left join (select visited_on, sum(hits) visits, count(*) uniq from public.wedding_analytics
                            where wedding_id = p_wedding and visited_on >= v_from group by visited_on) x
                  on x.visited_on = d::date)
  );
end $$;
grant execute on function public.get_wedding_analytics(uuid, int) to authenticated;

-- ---------- admin: templates & versioning ---------------------------
create or replace function public.assert_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin only' using errcode = '42501'; end if;
end $$;
grant execute on function public.assert_admin() to authenticated;

create or replace function public.admin_create_template(p_name text, p_slug text, p_config jsonb, p_sections jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_tpl uuid;
  v_ver uuid;
  s jsonb;
  i int := 0;
begin
  perform public.assert_admin();
  insert into public.invitation_templates (name, slug, created_by) values (p_name, p_slug, auth.uid()) returning id into v_tpl;
  insert into public.template_versions (template_id, version, config, created_by, changelog)
  values (v_tpl, 1, p_config, auth.uid(), 'Initial version') returning id into v_ver;
  for s in select * from jsonb_array_elements(coalesce(p_sections, '[]'::jsonb)) loop
    insert into public.template_sections (version_id, section_key, type, position, enabled, config)
    values (v_ver, s->>'key', s->>'type', i, coalesce((s->>'enabled')::boolean, true), coalesce(s->'config', '{}'::jsonb));
    i := i + 1;
  end loop;
  return v_tpl;
end $$;
grant execute on function public.admin_create_template(text, text, jsonb, jsonb) to authenticated;

-- Returns the template's draft version, creating it from the latest version if needed.
create or replace function public.admin_ensure_draft_version(p_template uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_draft uuid;
  v_src public.template_versions;
  v_next int;
begin
  perform public.assert_admin();
  select id into v_draft from public.template_versions where template_id = p_template and status = 'draft';
  if v_draft is not null then return v_draft; end if;
  select * into v_src from public.template_versions where template_id = p_template order by version desc limit 1;
  if v_src.id is null then raise exception 'Template has no versions'; end if;
  select coalesce(max(version), 0) + 1 into v_next from public.template_versions where template_id = p_template;
  insert into public.template_versions (template_id, version, config, created_by)
  values (p_template, v_next, v_src.config, auth.uid()) returning id into v_draft;
  insert into public.template_sections (version_id, section_key, type, position, enabled, config)
  select v_draft, section_key, type, position, enabled, config from public.template_sections where version_id = v_src.id;
  return v_draft;
end $$;
grant execute on function public.admin_ensure_draft_version(uuid) to authenticated;

create or replace function public.admin_publish_version(p_version uuid, p_changelog text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v public.template_versions;
begin
  perform public.assert_admin();
  select * into v from public.template_versions where id = p_version for update;
  if v.id is null or v.status <> 'draft' then raise exception 'Only a draft version can be published'; end if;
  if not exists (select 1 from public.template_sections where version_id = v.id and enabled) then
    raise exception 'A version needs at least one enabled section';
  end if;
  update public.template_versions set status = 'retired'
   where template_id = v.template_id and status = 'published';
  update public.template_versions set status = 'published', published_at = now(),
         changelog = coalesce(nullif(trim(p_changelog), ''), changelog)
   where id = v.id;
  update public.invitation_templates set current_version_id = v.id where id = v.template_id;
end $$;
grant execute on function public.admin_publish_version(uuid, text) to authenticated;

create or replace function public.admin_duplicate_template(p_template uuid, p_name text, p_slug text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  t public.invitation_templates;
  v_src uuid;
  v_new uuid;
  v_ver uuid;
begin
  perform public.assert_admin();
  select * into t from public.invitation_templates where id = p_template;
  if t.id is null then raise exception 'Template not found'; end if;
  v_src := coalesce(t.current_version_id,
                    (select id from public.template_versions where template_id = t.id order by version desc limit 1));
  insert into public.invitation_templates (slug, name, tagline, description, category_id, cultural_tags, languages,
                                           cover_image_url, preview_images, supports_music, supports_video,
                                           supports_gallery, status, is_featured, sample_data, created_by)
  values (p_slug, p_name, t.tagline, t.description, t.category_id, t.cultural_tags, t.languages,
          t.cover_image_url, t.preview_images, t.supports_music, t.supports_video, t.supports_gallery,
          'draft', false, t.sample_data, auth.uid())
  returning id into v_new;
  insert into public.template_versions (template_id, version, config, created_by, changelog)
  select v_new, 1, config, auth.uid(), 'Duplicated from ' || t.name from public.template_versions where id = v_src
  returning id into v_ver;
  insert into public.template_sections (version_id, section_key, type, position, enabled, config)
  select v_ver, section_key, type, position, enabled, config from public.template_sections where version_id = v_src;
  return v_new;
end $$;
grant execute on function public.admin_duplicate_template(uuid, text, text) to authenticated;

create or replace function public.admin_reorder_sections(p_version uuid, p_keys text[])
returns void language plpgsql security definer set search_path = public as $$
declare i int;
begin
  perform public.assert_admin();
  for i in 1 .. coalesce(array_length(p_keys, 1), 0) loop
    update public.template_sections set position = i - 1 where version_id = p_version and section_key = p_keys[i];
  end loop;
end $$;
grant execute on function public.admin_reorder_sections(uuid, text[]) to authenticated;

create or replace function public.admin_dashboard()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  perform public.assert_admin();
  return jsonb_build_object(
    'customers', (select count(*) from public.profiles),
    'weddings', (select count(*) from public.weddings),
    'published', (select count(*) from public.weddings where status = 'published'),
    'drafts', (select count(*) from public.weddings where status <> 'published'),
    'templates', (select count(*) from public.invitation_templates),
    'activeTemplates', (select count(*) from public.invitation_templates where status = 'published'),
    'visits30d', (select coalesce(sum(hits), 0) from public.wedding_analytics where visited_on > current_date - 30),
    'popular', coalesce((select jsonb_agg(x order by x.uses desc) from (
        select t.id, t.name, t.slug, t.cover_image_url as "coverImageUrl", count(w.id) uses
          from public.invitation_templates t left join public.weddings w on w.template_id = t.id
         group by t.id order by count(w.id) desc, t.name limit 6) x), '[]'::jsonb),
    'recent', coalesce((select jsonb_agg(r order by r.at desc) from (
        (select 'wedding_created' as kind, w.groom_name || ' & ' || w.bride_name as label, w.created_at as at
           from public.weddings w order by w.created_at desc limit 8)
        union all
        (select 'wedding_published', w.groom_name || ' & ' || w.bride_name, w.published_at
           from public.weddings w where w.published_at is not null order by w.published_at desc limit 8)
        union all
        (select 'version_published', t.name || ' v' || v.version, v.published_at
           from public.template_versions v join public.invitation_templates t on t.id = v.template_id
          where v.published_at is not null order by v.published_at desc limit 8)
        order by at desc limit 12) r), '[]'::jsonb)
  );
end $$;
grant execute on function public.admin_dashboard() to authenticated;

-- Hide internal helpers from the API surface.
revoke all on function public.guard_media_path() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
