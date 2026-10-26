begin;
create function public.community_digest_unsubscribe(p_token text) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if p_token is not null and char_length(p_token)=64 then
    update public.community_preferences set digest_enabled=false,digest_opted_at=null,updated_at=now() where unsubscribe_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
  end if;
  return jsonb_build_object('unsubscribed',found);
end $$;
revoke execute on function public.community_publish_program(uuid,text),public.community_programs_overview(uuid),public.community_programs_begin(text),public.community_digest_next(date),public.community_digest_finish(uuid,date,text),public.community_digest_unsubscribe(text) from public,anon,authenticated;
grant execute on function public.community_publish_program(uuid,text),public.community_programs_overview(uuid),public.community_programs_begin(text),public.community_digest_next(date),public.community_digest_finish(uuid,date,text),public.community_digest_unsubscribe(text) to service_role;
revoke execute on function public.community_digest_unsubscribe(text) from public,anon,authenticated;
grant execute on function public.community_digest_unsubscribe(text) to service_role;
commit;
