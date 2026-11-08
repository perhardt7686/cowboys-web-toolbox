begin;
-- Private authoring values and reading preferences never ride in public profiles.
create table public.community_profile_preferences(
  user_id uuid primary key references public.community_members(user_id) on delete cascade,
  details jsonb not null default '{}' check(jsonb_typeof(details)='object' and octet_length(details::text)<=5000),
  updated_at timestamptz not null default now()
);
alter table public.community_profile_preferences enable row level security;
create policy own_forum_preferences on public.community_profile_preferences for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.community_profile_preferences from public,anon,authenticated;
grant select on public.community_profile_preferences to authenticated;
grant all on public.community_profile_preferences to service_role;
insert into public.community_profile_preferences(user_id,details) select user_id,details from public.community_profiles;
-- Existing optional extras are retained privately; no new sharing is inferred.
update public.community_profiles set details='{}';
create or replace function public.community_save_profile(p_user uuid,p_name text,p_profile jsonb default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result public.community_profiles%rowtype;meta jsonb;shared jsonb;
begin
  update public.community_members set display_name=p_name where user_id=p_user;
  if not found then raise exception 'Member unavailable'; end if;
  if p_profile is not null then
    meta:=coalesce(p_profile->'details',(select details from public.community_profile_preferences where user_id=p_user),'{}'::jsonb);
    shared:=jsonb_build_object('frame',coalesce(meta->>'frame','plain'),'layout',coalesce(meta->>'layout','classic'),'reply_location',coalesce((meta->>'reply_location')::boolean,false));
    if coalesce((meta->>'share_about')::boolean,false) then
      shared:=shared||jsonb_build_object('share_about',true,'title',meta->>'title','pronouns',meta->>'pronouns','occupation',meta->>'occupation','status',meta->>'status','skills',meta->'skills','favorite_tools',meta->'favorite_tools');
    end if;
    if coalesce((meta->>'share_signature')::boolean,false) then shared:=shared||jsonb_build_object('share_signature',true,'signature',meta->>'signature');end if;
    insert into public.community_profile_preferences(user_id,details) values(p_user,meta) on conflict(user_id) do update set details=excluded.details,updated_at=now();
    update public.community_profiles set handle=nullif(p_profile->>'handle',''),headline=p_profile->>'headline',bio=p_profile->>'bio',location=p_profile->>'location',website=p_profile->>'website',interests=p_profile->'interests',links=p_profile->'links',avatar_mode=p_profile->>'avatar_mode',avatar_icon=p_profile->>'avatar_icon',avatar_path=p_profile->>'avatar_path',theme=p_profile->>'theme',cover=p_profile->>'cover',published=(p_profile->>'published')::boolean,details=shared,updated_at=now() where user_id=p_user;
  end if;
  update public.community_threads set author_name=p_name where author_id=p_user and author_name<>p_name;
  update public.community_replies set author_name=p_name where author_id=p_user and author_kind='member' and author_name<>p_name;
  insert into public.community_audit(actor_id,action,subject_id) values(p_user,'profile.updated',p_user);
  select * into result from public.community_profiles where user_id=p_user;
  select details into meta from public.community_profile_preferences where user_id=p_user;
  return to_jsonb(result)||jsonb_build_object('details',coalesce(meta,'{}'::jsonb));
end;$$;
revoke all on function public.community_save_profile(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.community_save_profile(uuid,text,jsonb) to service_role;

alter table public.community_replies add column reply_to_id uuid references public.community_replies(id) on delete set null,add column edited_at timestamptz;
alter table public.community_threads add column activity_at timestamptz not null default now(),add column last_reply_at timestamptz,add column visible_reply_count integer not null default 0 check(visible_reply_count>=0);
create index community_threads_active on public.community_threads(pinned desc,activity_at desc,id) where status='published';
create index community_replies_paging on public.community_replies(thread_id,created_at,id) where status='published';
create function community_private.check_reply_reference() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.reply_to_id is not null and (TG_OP='INSERT' or new.reply_to_id is distinct from old.reply_to_id) then
    if new.reply_to_id=new.id or not exists(select 1 from public.community_replies r where r.id=new.reply_to_id and r.thread_id=new.thread_id and r.status='published') then raise exception 'Referenced reply unavailable';end if;
  end if;
  -- Location is read from a currently shared profile, never copied into a public post.
  new.location_label:='';return new;
end;$$;
revoke all on function community_private.check_reply_reference() from public,anon,authenticated;
grant execute on function community_private.check_reply_reference() to service_role;
create trigger community_reply_reference before insert or update on public.community_replies for each row execute function community_private.check_reply_reference();
create function public.community_edit_reply(p_actor uuid,p_reply uuid,p_body text,p_status text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare target public.community_replies%rowtype;who public.community_members%rowtype;
begin
  select * into who from public.community_members where user_id=p_actor;
  if who.status is distinct from 'approved' then raise exception 'Posting access unavailable';end if;
  select * into target from public.community_replies where id=p_reply for update;
  if target.id is null or target.status<>'published' or target.author_kind<>'member' or (target.author_id is distinct from p_actor and who.role<>'owner') then raise exception 'Reply unavailable';end if;
  if not exists(select 1 from public.community_threads where id=target.thread_id and status='published' and not locked) then raise exception 'Conversation closed';end if;
  if char_length(p_body) not between 2 and 6000 or p_status not in ('published','held') then raise exception 'Invalid reply';end if;
  update public.community_replies set body=p_body,status=p_status,edited_at=now() where id=p_reply returning * into target;
  insert into public.community_audit(actor_id,action,subject_id) values(p_actor,'reply.edited',p_reply);
  return to_jsonb(target);
end;$$;
revoke all on function public.community_edit_reply(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.community_edit_reply(uuid,uuid,text,text) to service_role;
create or replace function public.community_lab_reply_event() returns trigger language plpgsql security invoker set search_path='' as $$
declare tid uuid:=coalesce(new.thread_id,old.thread_id);tr public.community_threads%rowtype;
begin
  update public.community_threads set visible_reply_count=(select count(*) from public.community_replies where thread_id=tid and status='published'),last_reply_at=(select max(created_at) from public.community_replies where thread_id=tid and status='published'),activity_at=coalesce((select max(created_at) from public.community_replies where thread_id=tid and status='published'),created_at),human_reply_count=(select count(*) from public.community_replies where thread_id=tid and status='published' and author_kind='member') where id=tid;
  select * into tr from public.community_threads where id=tid;
  if tr.accepted_reply_id is not null and not exists(select 1 from public.community_replies where id=tr.accepted_reply_id and thread_id=tid and status='published') then
    update public.community_threads set accepted_reply_id=null where id=tid;
    update public.community_badges set active=false where thread_id=tid and badge='Helpful Hand';
  end if;
  if TG_OP<>'DELETE' and new.status='published' and tr.status='published' and (TG_OP='INSERT' or old.status<>'published') then
    insert into public.community_notifications(user_id,thread_id,title,last_reply_id)
    select c.user_id,tid,tr.title,new.id from public.community_choices c join public.community_members m on m.user_id=c.user_id
    where c.thread_id=tid and c.following and m.status='approved' and c.user_id is distinct from new.author_id
    on conflict(user_id,thread_id) do update set title=excluded.title,last_reply_id=excluded.last_reply_id,unread=true,updated_at=now();
  end if;
  perform public.community_refresh_site(tr.site_id);
  return null;
end $$;

update public.community_threads t set visible_reply_count=(select count(*) from public.community_replies r where r.thread_id=t.id and r.status='published'),last_reply_at=(select max(r.created_at) from public.community_replies r where r.thread_id=t.id and r.status='published'),activity_at=coalesce((select max(r.created_at) from public.community_replies r where r.thread_id=t.id and r.status='published'),t.created_at);
commit;
