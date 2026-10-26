begin;
create function public.community_publish_program(p_actor uuid,p_slug text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare item public.community_editorial%rowtype;tid uuid;
begin
  if not exists(select 1 from public.community_members where user_id=p_actor and role='owner' and status='approved') then raise exception 'Owner required' using errcode='22023';end if;
  select * into item from public.community_editorial where slug=p_slug for update;
  if item.slug is null then raise exception 'Choose a starter prompt' using errcode='22023';end if;
  if item.published_thread_id is not null then return jsonb_build_object('threadId',item.published_thread_id,'created',false);end if;
  insert into public.community_threads(author_id,author_name,title,body,category,post_kind,post_data,pinned)
  values(p_actor,'Cowboy',item.title,item.body,item.category,item.post_kind,jsonb_build_object('ownerPrompt',true),false) returning id into tid;
  update public.community_editorial set published_thread_id=tid,published_at=now() where slug=p_slug;
  insert into public.community_audit(actor_id,action,subject_id,details) values(p_actor,'program.published',tid,jsonb_build_object('slug',p_slug));
  return jsonb_build_object('threadId',tid,'created',true);
end $$;
revoke execute on function public.community_publish_program(uuid,text) from public,anon,authenticated;
grant execute on function public.community_publish_program(uuid,text) to service_role;
commit;
