-- Recovered from the already-applied, same-named hosted migration.
begin;
alter table public.community_replies add column location_label text not null default '' check(char_length(location_label)<=60);
alter table public.community_profiles add column details jsonb not null default '{}'::jsonb check(jsonb_typeof(details)='object' and octet_length(details::text)<=5000);
create or replace function public.community_save_profile(p_user uuid,p_name text,p_profile jsonb default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result public.community_profiles%rowtype;
begin
  update public.community_members set display_name=p_name where user_id=p_user;
  if not found then raise exception 'Member unavailable'; end if;
  if p_profile is not null then
    update public.community_profiles set handle=nullif(p_profile->>'handle',''),headline=p_profile->>'headline',bio=p_profile->>'bio',location=p_profile->>'location',website=p_profile->>'website',interests=p_profile->'interests',links=p_profile->'links',avatar_mode=p_profile->>'avatar_mode',avatar_icon=p_profile->>'avatar_icon',avatar_path=p_profile->>'avatar_path',theme=p_profile->>'theme',cover=p_profile->>'cover',published=(p_profile->>'published')::boolean,details=coalesce(p_profile->'details',details),updated_at=now() where user_id=p_user;
  end if;
  update public.community_threads set author_name=p_name where author_id=p_user and author_name<>p_name;
  update public.community_replies set author_name=p_name where author_id=p_user and author_kind='member' and author_name<>p_name;
  insert into public.community_audit(actor_id,action,subject_id) values(p_user,'profile.updated',p_user);
  select * into result from public.community_profiles where user_id=p_user;
  return to_jsonb(result);
end;$$;
revoke all on function public.community_save_profile(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.community_save_profile(uuid,text,jsonb) to service_role;
create function public.community_search_threads(p_query text)
returns setof public.community_threads language sql stable security invoker set search_path='' as $$
  select t.* from public.community_threads t where t.status='published' and char_length(btrim(p_query)) between 1 and 180
    and (t.search_document @@ websearch_to_tsquery('simple',p_query) or exists(select 1 from public.community_replies r where r.thread_id=t.id and r.status='published' and to_tsvector('simple',r.body) @@ websearch_to_tsquery('simple',p_query)));
$$;
revoke all on function public.community_search_threads(text) from public;
grant execute on function public.community_search_threads(text) to anon,authenticated,service_role;
create index community_reply_body_search on public.community_replies using gin(to_tsvector('simple',body)) where status='published';
commit;
