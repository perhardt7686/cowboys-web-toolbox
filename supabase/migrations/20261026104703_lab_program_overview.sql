begin;
create function public.community_programs_overview(p_actor uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.community_members where user_id=p_actor and role='owner' and status='approved') then raise exception 'Owner required' using errcode='22023';end if;
  return jsonb_build_object('editorial',coalesce((select jsonb_agg(to_jsonb(x)) from(select slug,title,post_kind,published_thread_id,published_at from public.community_editorial order by position)x),'[]'::jsonb),
    'digests',coalesce((select jsonb_agg(to_jsonb(x)) from(select week_start,status,count(*)::integer count from public.community_digest_jobs group by week_start,status order by week_start desc limit 20)x),'[]'::jsonb));
end $$;
revoke execute on function public.community_programs_overview(uuid) from public,anon,authenticated;
grant execute on function public.community_programs_overview(uuid) to service_role;
commit;
