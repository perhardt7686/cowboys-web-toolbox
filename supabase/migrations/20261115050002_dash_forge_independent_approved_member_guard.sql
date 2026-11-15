create or replace function public.community_dash_allowed()
 returns boolean language sql stable security definer
 set search_path to pg_catalog,public
 as $fn$ select auth.uid() is not null and exists (
  select 1 from public.community_members m where m.user_id=auth.uid() and m.status='approved'
 ); $fn$; revoke all on function public.community_dash_allowed() from PUBLIC,anon;
grant execute on function public.community_dash_allowed() to authenticated;