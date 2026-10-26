begin;
create function public.community_create_lab_thread(p_actor uuid,p_post jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare m public.community_members%rowtype;tr public.community_threads%rowtype;
begin
  select * into m from public.community_members where user_id=p_actor and status='approved';
  if m.user_id is null then raise exception 'Approved posting access required' using errcode='22023';end if;
  perform pg_advisory_xact_lock(hashtext(p_actor::text));
  insert into public.community_threads(author_id,author_name,title,body,category,site_id,status,post_kind,post_data)
  values(p_actor,m.display_name,p_post->>'title',p_post->>'body',p_post->>'category',nullif(p_post->>'site_id',''),p_post->>'status',p_post->>'post_kind',p_post->'post_data') returning * into tr;
  if tr.status='published' and (select count(*) from public.community_choices where user_id=p_actor and(following or saved))<200 then
    insert into public.community_choices(user_id,thread_id,following) values(p_actor,tr.id,true);
  end if;
  return to_jsonb(tr);
end $$;
revoke execute on function public.community_create_lab_thread(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.community_create_lab_thread(uuid,jsonb) to service_role;
commit;
