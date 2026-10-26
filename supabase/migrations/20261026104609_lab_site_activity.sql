begin;
create function public.community_refresh_site(p_site text) returns void language plpgsql security invoker set search_path='' as $$
declare recent record;
begin
  if p_site is null or not exists(select 1 from public.community_site_totals where site_id=p_site) then return;end if;
  select id,title into recent from public.community_threads where site_id=p_site and status='published' order by created_at desc,id limit 1;
  insert into public.community_site_activity(site_id,thread_count,reply_count,worked_count,paid_count,problem_count,last_thread_id,last_title)
  select p_site,count(*)::integer,
    coalesce((select count(*) from public.community_replies r join public.community_threads tr on tr.id=r.thread_id where tr.site_id=p_site and tr.status='published' and r.status='published'),0)::integer,
    count(*) filter(where post_kind='review' and post_data->>'outcome'='worked')::integer,
    count(*) filter(where post_kind='review' and post_data->>'outcome'='paid')::integer,
    count(*) filter(where post_kind='review' and post_data->>'outcome'='problem')::integer,recent.id,recent.title
  from public.community_threads where site_id=p_site and status='published'
  on conflict(site_id) do update set thread_count=excluded.thread_count,reply_count=excluded.reply_count,worked_count=excluded.worked_count,paid_count=excluded.paid_count,problem_count=excluded.problem_count,last_thread_id=excluded.last_thread_id,last_title=excluded.last_title,updated_at=now();
end $$;
revoke execute on function public.community_refresh_site(text) from public,anon,authenticated;
grant execute on function public.community_refresh_site(text) to service_role;
commit;
