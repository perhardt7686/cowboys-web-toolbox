begin;
create function public.community_digest_finish(p_user uuid,p_week date,p_status text) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if p_status not in ('sent','failed','skipped') then raise exception 'Invalid digest result' using errcode='22023';end if;
  update public.community_digest_jobs set status=p_status,finished_at=now() where user_id=p_user and week_start=p_week and status='sending';
  return jsonb_build_object('recorded',found);
end $$;
revoke execute on function public.community_digest_finish(uuid,date,text) from public,anon,authenticated;
grant execute on function public.community_digest_finish(uuid,date,text) to service_role;
commit;
