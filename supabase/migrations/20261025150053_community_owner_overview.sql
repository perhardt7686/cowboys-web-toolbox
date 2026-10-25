begin;
create function public.community_admin_overview(p_actor uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
  if not exists(select 1 from public.community_members where user_id=p_actor and role='owner' and status='approved') then raise exception 'Owner required'; end if;
  select jsonb_build_object(
    'counts',jsonb_build_object('members',(select count(*) from public.community_members),'approved',(select count(*) from public.community_members where status='approved'),'pending',(select count(*) from public.community_members where status='pending'),'suspended',(select count(*) from public.community_members where status='suspended'),'threads',(select count(*) from public.community_threads where status='published'),'replies',(select count(*) from public.community_replies where status='published'),'held',(select count(*) from public.community_threads where status='held')+(select count(*) from public.community_replies where status='held'),'reports',(select count(*) from public.community_reports where status='open'),'clicks',(select coalesce(sum(clicks),0) from public.community_site_totals),'scheduled_replies',(select count(*) from public.community_moderator_receipts),'failed_notices',(select count(*) from public.community_approvals where email_status='failed')),
    'sites',coalesce((select jsonb_agg(to_jsonb(t)) from(select * from public.community_site_totals order by clicks desc,site_id)t),'[]'::jsonb),
    'daily',coalesce((select jsonb_agg(to_jsonb(t) order by t.day) from(select g.day::date as day,coalesce(sum(c.clicks),0)::bigint as clicks from generate_series(((now() at time zone 'America/New_York')::date-13)::timestamp,((now() at time zone 'America/New_York')::date)::timestamp,interval '1 day') as g(day) left join public.community_daily_clicks c on c.day=g.day::date group by g.day)t),'[]'::jsonb),
    'audit',coalesce((select jsonb_agg(to_jsonb(t)) from(select id,actor_id,action,subject_id,details,created_at from public.community_audit order by created_at desc,id desc limit 40)t),'[]'::jsonb),
    'announcement',(select to_jsonb(s) from public.community_settings s where id='community')
  ) into result;
  return result;
end;$$;
revoke all on function public.community_admin_overview(uuid) from public,anon,authenticated;grant execute on function public.community_admin_overview(uuid) to service_role;
commit;
