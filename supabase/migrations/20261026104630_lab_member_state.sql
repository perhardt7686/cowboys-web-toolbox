begin;
create function public.community_hub_state(p_actor uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.community_members where user_id=p_actor) then raise exception 'Membership required' using errcode='22023';end if;
  return jsonb_build_object(
    'choices',coalesce((select jsonb_agg(to_jsonb(x)) from (select c.* from public.community_choices c join public.community_threads t on t.id=c.thread_id where c.user_id=p_actor and t.status='published' order by c.updated_at desc limit 400) x),'[]'::jsonb),
    'notifications',coalesce((select jsonb_agg(to_jsonb(x)) from (select n.* from public.community_notifications n join public.community_threads t on t.id=n.thread_id where n.user_id=p_actor and t.status='published' order by n.updated_at desc limit 30) x),'[]'::jsonb),
    'digestEnabled',coalesce((select digest_enabled from public.community_preferences where user_id=p_actor),false)
  );
end $$;
revoke execute on function public.community_hub_state(uuid) from public,anon,authenticated;
grant execute on function public.community_hub_state(uuid) to service_role;
commit;
