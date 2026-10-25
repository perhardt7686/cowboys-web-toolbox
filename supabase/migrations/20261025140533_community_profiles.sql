begin;
create table public.community_profiles (
  user_id uuid primary key references public.community_members(user_id) on delete cascade,
  display_name text not null check(char_length(display_name) between 2 and 36),
  handle text check(handle is null or handle ~ '^[a-z][a-z0-9_]{2,23}$'),
  headline text not null default '' check(char_length(headline)<=80),
  bio text not null default '' check(char_length(bio)<=600),
  location text not null default '' check(char_length(location)<=60),
  website text not null default '' check(char_length(website)<=300 and (website='' or website like 'https://%')),
  interests jsonb not null default '[]' check(jsonb_typeof(interests)='array' and jsonb_array_length(interests)<=8 and octet_length(interests::text)<=1000),
  links jsonb not null default '[]' check(jsonb_typeof(links)='array' and jsonb_array_length(links)<=3 and octet_length(links::text)<=2000),
  avatar_mode text not null default 'initials' check(avatar_mode in ('initials','icon','photo')),
  avatar_icon text not null default 'compass' check(avatar_icon in ('compass','spark','leaf','hammer','bolt','mountain','coffee','fox','planet','rocket','paw')),
  avatar_path text check(avatar_path is null or avatar_path in (user_id::text||'/avatar.webp',user_id::text||'/avatar.png')),
  theme text not null default 'forest' check(theme in ('forest','copper','ocean','midnight','sunrise','plum')),
  cover text not null default 'contours' check(cover in ('contours','dots','sunburst','stripes','plain','circuit')),
  published boolean not null default false,
  account_active boolean not null default false,
  badge text check(badge is null or badge='Owner'),
  joined_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  check(avatar_mode<>'photo' or avatar_path is not null)
);
create unique index community_profile_handle on public.community_profiles(lower(handle)) where handle is not null;
create index community_profile_public_avatar on public.community_profiles(avatar_path) where published and account_active and avatar_path is not null;
alter table public.community_profiles enable row level security;
create policy own_profile on public.community_profiles for select to authenticated using(user_id=(select auth.uid()));
create policy shared_profiles on public.community_profiles for select to anon,authenticated using(published and account_active);
revoke all on public.community_profiles from public,anon,authenticated;
grant select on public.community_profiles to anon,authenticated;
grant all on public.community_profiles to service_role;

create schema if not exists community_private;
revoke all on schema community_private from public,anon,authenticated;
grant usage on schema community_private to service_role;
create function community_private.sync_profile() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  insert into public.community_profiles(user_id,display_name,account_active,badge,joined_at)
    values(new.user_id,new.display_name,new.status='approved',case when new.role='owner' then 'Owner' end,new.created_at)
    on conflict(user_id) do update set display_name=excluded.display_name,account_active=excluded.account_active,badge=excluded.badge,updated_at=now();
  return new;
end;$$;
revoke all on function community_private.sync_profile() from public,anon,authenticated;
grant execute on function community_private.sync_profile() to service_role;
create trigger community_profile_membership_sync after insert or update of display_name,status,role on public.community_members
  for each row execute function community_private.sync_profile();
insert into public.community_profiles(user_id,display_name,account_active,badge,joined_at)
  select user_id,display_name,status='approved',case when role='owner' then 'Owner' end,created_at from public.community_members;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('community-avatars','community-avatars',false,131072,array['image/webp','image/png']);
create policy community_avatar_read on storage.objects for select to anon,authenticated using(
  bucket_id='community-avatars' and (
    name in ((select auth.uid())::text||'/avatar.webp',(select auth.uid())::text||'/avatar.png')
    or exists(select 1 from public.community_profiles p where p.avatar_path=storage.objects.name and p.published and p.account_active)
  )
);
create policy community_avatar_insert on storage.objects for insert to authenticated with check(
  bucket_id='community-avatars' and name in ((select auth.uid())::text||'/avatar.webp',(select auth.uid())::text||'/avatar.png')
  and exists(select 1 from public.community_members m where m.user_id=(select auth.uid()))
);
create policy community_avatar_update on storage.objects for update to authenticated using(
  bucket_id='community-avatars' and name in ((select auth.uid())::text||'/avatar.webp',(select auth.uid())::text||'/avatar.png')
) with check(bucket_id='community-avatars' and name in ((select auth.uid())::text||'/avatar.webp',(select auth.uid())::text||'/avatar.png'));
create policy community_avatar_delete on storage.objects for delete to authenticated using(
  bucket_id='community-avatars' and name in ((select auth.uid())::text||'/avatar.webp',(select auth.uid())::text||'/avatar.png')
);

create function public.community_save_profile(p_user uuid,p_name text,p_profile jsonb default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result public.community_profiles%rowtype;
begin
  update public.community_members set display_name=p_name where user_id=p_user;
  if not found then raise exception 'Member unavailable'; end if;
  if p_profile is not null then
    update public.community_profiles set handle=nullif(p_profile->>'handle',''),headline=p_profile->>'headline',bio=p_profile->>'bio',location=p_profile->>'location',website=p_profile->>'website',interests=p_profile->'interests',links=p_profile->'links',avatar_mode=p_profile->>'avatar_mode',avatar_icon=p_profile->>'avatar_icon',avatar_path=p_profile->>'avatar_path',theme=p_profile->>'theme',cover=p_profile->>'cover',published=(p_profile->>'published')::boolean,updated_at=now() where user_id=p_user;
  end if;
  update public.community_threads set author_name=p_name where author_id=p_user and author_name<>p_name;
  update public.community_replies set author_name=p_name where author_id=p_user and author_kind='member' and author_name<>p_name;
  insert into public.community_audit(actor_id,action,subject_id) values(p_user,'profile.updated',p_user);
  select * into result from public.community_profiles where user_id=p_user;
  return to_jsonb(result);
end;$$;

revoke all on function public.community_save_profile(uuid,text,jsonb) from public,anon,authenticated;grant execute on function public.community_save_profile(uuid,text,jsonb) to service_role;
commit;
