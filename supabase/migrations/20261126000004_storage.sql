-- =====================================================================
-- Storage
--   wedding-assets  (private)  {owner_uid}/{wedding_id}/{photos|videos|audio|thumbnails|events}/{file}
--   template-assets (public)   {template_id|library}/{previews|backgrounds|decorations|audio}/{file}
-- Bucket-level limits are enforced by Storage itself; folder/ownership rules
-- by the policies below. File contents are additionally sniffed client-side
-- (magic bytes) before upload — extensions are never trusted.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('wedding-assets', 'wedding-assets', false, 157286400,
   array['image/webp','image/jpeg','image/png','video/mp4','video/webm',
         'audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/webm']),
  ('template-assets', 'template-assets', true, 20971520,
   array['image/webp','image/jpeg','image/png','image/svg+xml','audio/mpeg','audio/mp4','audio/ogg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Folder helpers compare as text so malformed paths can never raise a cast error.
create or replace function public.owns_wedding_folder(p_owner text, p_wedding text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
     and p_owner = auth.uid()::text
     and exists (select 1 from public.weddings where id::text = p_wedding and owner_id = auth.uid());
$$;
create or replace function public.is_published_wedding_folder(p_owner text, p_wedding text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.weddings
                  where id::text = p_wedding and owner_id::text = p_owner and status = 'published');
$$;
revoke all on function public.owns_wedding_folder(text, text) from public;
revoke all on function public.is_published_wedding_folder(text, text) from public;
grant execute on function public.owns_wedding_folder(text, text) to authenticated;
grant execute on function public.is_published_wedding_folder(text, text) to anon, authenticated;

-- Allowed sub-folders and extensions for customer uploads.
create or replace function public.is_allowed_wedding_object(p_name text)
returns boolean language sql immutable as $$
  select case (storage.foldername(p_name))[3]
    when 'photos'     then lower(storage.extension(p_name)) in ('webp','jpg','jpeg','png')
    when 'thumbnails' then lower(storage.extension(p_name)) in ('webp','jpg','jpeg','png')
    when 'events'     then lower(storage.extension(p_name)) in ('webp','jpg','jpeg','png')
    when 'videos'     then lower(storage.extension(p_name)) in ('mp4','webm')
    when 'audio'      then lower(storage.extension(p_name)) in ('mp3','m4a','aac','ogg','wav','weba')
    else false end
  and array_length(storage.foldername(p_name), 1) = 3
  and p_name !~ '\.\.';
$$;

-- ---------- wedding-assets ----------
create policy wedding_assets_owner_read on storage.objects for select to authenticated
  using (bucket_id = 'wedding-assets'
         and public.owns_wedding_folder((storage.foldername(name))[1], (storage.foldername(name))[2]));

create policy wedding_assets_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'wedding-assets'
              and public.owns_wedding_folder((storage.foldername(name))[1], (storage.foldername(name))[2])
              and public.is_allowed_wedding_object(name));

create policy wedding_assets_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'wedding-assets'
         and public.owns_wedding_folder((storage.foldername(name))[1], (storage.foldername(name))[2]))
  with check (bucket_id = 'wedding-assets'
              and public.owns_wedding_folder((storage.foldername(name))[1], (storage.foldername(name))[2])
              and public.is_allowed_wedding_object(name));

-- Owners may delete even after the wedding row is gone (cleanup of their own folder).
create policy wedding_assets_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'wedding-assets' and (storage.foldername(name))[1] = auth.uid()::text);

-- Guests: read (i.e. create signed URLs for) objects of published weddings only.
create policy wedding_assets_published_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'wedding-assets'
         and public.is_published_wedding_folder((storage.foldername(name))[1], (storage.foldername(name))[2]));

create policy wedding_assets_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'wedding-assets' and public.is_admin());

-- ---------- template-assets (public bucket) ----------
create policy template_assets_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'template-assets');
create policy template_assets_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'template-assets' and public.is_admin());
create policy template_assets_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'template-assets' and public.is_admin())
  with check (bucket_id = 'template-assets' and public.is_admin());
create policy template_assets_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'template-assets' and public.is_admin());
