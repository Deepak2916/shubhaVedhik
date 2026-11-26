-- =====================================================================
-- Row Level Security. Every table has RLS enabled. See docs/SECURITY.md
-- for a plain-language description of every policy.
-- =====================================================================

-- Role checks used by policies. SECURITY DEFINER so they can read
-- admin_roles regardless of the caller's own RLS visibility (and so the
-- admin_roles policies don't recurse into themselves).
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_roles where user_id = auth.uid());
$$;
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_roles where user_id = auth.uid() and role = 'super_admin');
$$;
create or replace function public.owns_wedding(p_wedding uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.weddings where id = p_wedding and owner_id = auth.uid());
$$;
-- "Does the current user have a wedding using this template / version?"
create or replace function public.uses_template(p_template uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
     and exists (select 1 from public.weddings where template_id = p_template and owner_id = auth.uid());
$$;
create or replace function public.uses_template_version(p_version uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
     and exists (select 1 from public.weddings where template_version_id = p_version and owner_id = auth.uid());
$$;
revoke all on function public.uses_template(uuid) from public;
revoke all on function public.uses_template_version(uuid) from public;
grant execute on function public.uses_template(uuid) to anon, authenticated;
grant execute on function public.uses_template_version(uuid) to anon, authenticated;
revoke all on function public.is_admin() from public;
revoke all on function public.is_super_admin() from public;
revoke all on function public.owns_wedding(uuid) from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.owns_wedding(uuid) to authenticated;

alter table public.profiles                   enable row level security;
alter table public.admin_roles                enable row level security;
alter table public.template_categories        enable row level security;
alter table public.invitation_templates       enable row level security;
alter table public.template_versions          enable row level security;
alter table public.template_sections          enable row level security;
alter table public.template_media             enable row level security;
alter table public.weddings                   enable row level security;
alter table public.wedding_photos             enable row level security;
alter table public.wedding_videos             enable row level security;
alter table public.wedding_audio              enable row level security;
alter table public.wedding_events             enable row level security;
alter table public.wedding_messages           enable row level security;
alter table public.wedding_analytics          enable row level security;
alter table public.wedding_guest_interactions enable row level security;
alter table public.platform_settings          enable row level security;

-- ---------- profiles ----------
create policy profiles_select_self on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- ---------- admin_roles: read own row; only super admins manage ----------
create policy admin_roles_select on public.admin_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy admin_roles_insert on public.admin_roles for insert to authenticated
  with check (public.is_super_admin());
create policy admin_roles_update on public.admin_roles for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy admin_roles_delete on public.admin_roles for delete to authenticated
  using (public.is_super_admin() and user_id <> auth.uid());

-- ---------- template catalogue: public reads published, admins do all ----
create policy categories_read on public.template_categories for select to anon, authenticated using (true);
create policy categories_admin_insert on public.template_categories for insert to authenticated with check (public.is_admin());
create policy categories_admin_update on public.template_categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy categories_admin_delete on public.template_categories for delete to authenticated using (public.is_admin());

create policy templates_read on public.invitation_templates for select to anon, authenticated
  using (status = 'published' or public.is_admin()
         or public.uses_template(id));
create policy templates_admin_insert on public.invitation_templates for insert to authenticated with check (public.is_admin());
create policy templates_admin_update on public.invitation_templates for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy templates_admin_delete on public.invitation_templates for delete to authenticated using (public.is_admin());

-- Published versions are readable by everyone (previews). A customer can also
-- read the (possibly retired) version their own wedding is pinned to. Guests
-- reach retired versions only through get_public_wedding().
create policy versions_read on public.template_versions for select to anon, authenticated
  using (status = 'published' or public.is_admin()
         or public.uses_template_version(id));
create policy versions_admin_insert on public.template_versions for insert to authenticated with check (public.is_admin());
create policy versions_admin_update on public.template_versions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy versions_admin_delete on public.template_versions for delete to authenticated using (public.is_admin());

create policy sections_read on public.template_sections for select to anon, authenticated
  using (exists (select 1 from public.template_versions v where v.id = version_id));  -- inherits versions_read visibility
create policy sections_admin_insert on public.template_sections for insert to authenticated with check (public.is_admin());
create policy sections_admin_update on public.template_sections for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy sections_admin_delete on public.template_sections for delete to authenticated using (public.is_admin());

create policy template_media_read on public.template_media for select to anon, authenticated
  using (is_active or public.is_admin());
create policy template_media_admin_insert on public.template_media for insert to authenticated with check (public.is_admin());
create policy template_media_admin_update on public.template_media for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy template_media_admin_delete on public.template_media for delete to authenticated using (public.is_admin());

-- ---------- weddings: owners only. Guests NEVER read the table directly;
-- they use get_public_wedding(slug), which returns a sanitised projection.
create policy weddings_owner_select on public.weddings for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());
create policy weddings_owner_insert on public.weddings for insert to authenticated
  with check (owner_id = auth.uid() and status = 'draft');
create policy weddings_owner_update on public.weddings for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy weddings_owner_delete on public.weddings for delete to authenticated
  using (owner_id = auth.uid());

-- Column privileges: status / published_at / owner_id / template_id /
-- template_version_id can only change through RPCs (publish_wedding,
-- select_wedding_template, upgrade_wedding_template).
revoke insert, update on public.weddings from authenticated;
revoke all on public.weddings from anon;
grant insert (slug, groom_name, bride_name, groom_parents, bride_parents, wedding_date, wedding_time,
              city, venue_name, venue_address, maps_url, couple_intro, invitation_message, religion,
              primary_language, languages, traditions, localized)
  on public.weddings to authenticated;
grant update (slug, groom_name, bride_name, groom_parents, bride_parents,
              wedding_date, wedding_time, city, venue_name, venue_address, maps_url,
              couple_intro, invitation_message, religion, primary_language, languages, traditions, localized,
              theme_overrides, music_settings, cover_photo_id)
  on public.weddings to authenticated;

-- ---------- child content tables: owner-scoped CRUD ----------
do $$
declare t text;
begin
  foreach t in array array['wedding_photos','wedding_videos','wedding_audio','wedding_events','wedding_messages']
  loop
    execute format($f$
      create policy %1$s_owner_select on public.%1$s for select to authenticated
        using (public.owns_wedding(wedding_id) or public.is_admin());
      create policy %1$s_owner_insert on public.%1$s for insert to authenticated
        with check (public.owns_wedding(wedding_id));
      create policy %1$s_owner_update on public.%1$s for update to authenticated
        using (public.owns_wedding(wedding_id)) with check (public.owns_wedding(wedding_id));
      create policy %1$s_owner_delete on public.%1$s for delete to authenticated
        using (public.owns_wedding(wedding_id));
      revoke all on public.%1$s from anon;
    $f$, t);
  end loop;
end $$;

-- ---------- analytics: written only via RPC, read by owner/admin ----------
create policy analytics_owner_read on public.wedding_analytics for select to authenticated
  using (public.owns_wedding(wedding_id) or public.is_admin());
create policy interactions_owner_read on public.wedding_guest_interactions for select to authenticated
  using (public.owns_wedding(wedding_id) or public.is_admin());
revoke insert, update, delete on public.wedding_analytics, public.wedding_guest_interactions from anon, authenticated;

-- ---------- platform settings ----------
create policy settings_read on public.platform_settings for select to anon, authenticated
  using (is_public or public.is_admin());
create policy settings_admin_insert on public.platform_settings for insert to authenticated with check (public.is_admin());
create policy settings_admin_update on public.platform_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy settings_admin_delete on public.platform_settings for delete to authenticated using (public.is_admin());
