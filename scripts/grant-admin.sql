-- Grant platform admin rights. Run in the Supabase SQL editor (runs as the
-- postgres role, bypassing RLS). The user must have signed up first.
-- Only super_admins can later grant/revoke admins from inside the app.
insert into public.admin_roles (user_id, role)
select id, 'super_admin' from auth.users where email = 'REPLACE_WITH_ADMIN_EMAIL'
on conflict (user_id) do update set role = excluded.role;
