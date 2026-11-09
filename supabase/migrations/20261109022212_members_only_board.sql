begin;
-- Restrictive policies intersect every existing visibility policy. A valid JWT
-- alone is not membership: approval is read afresh from the protected own row.
do $$declare target text;begin
 foreach target in array array['community_threads','community_replies','community_profiles','community_member_honors','community_badges','community_settings','community_site_activity','community_catalog_additions','community_choices','community_notifications'] loop
  execute format('create policy approved_board_read on public.%I as restrictive for select to authenticated using ((select exists(select 1 from public.community_members m where m.user_id=(select auth.uid()) and m.status=''approved'')))',target);
  execute format('revoke select on public.%I from anon',target);
 end loop;
end;$$;
revoke execute on function public.community_search_threads(text) from public,anon;
grant execute on function public.community_search_threads(text) to authenticated,service_role;

-- The private bucket still supports an account's own avatar. Seeing another
-- member's chosen photo requires current approval, like their shared profile.
alter policy community_avatar_read on storage.objects to authenticated using(
 bucket_id='community-avatars' and (
  name in ((select auth.uid())::text||'/avatar.webp',(select auth.uid())::text||'/avatar.png')
  or ((select exists(select 1 from public.community_members m where m.user_id=(select auth.uid()) and m.status='approved'))
      and exists(select 1 from public.community_profiles p where p.avatar_path=storage.objects.name and p.published and p.account_active))
 ));

-- An explicit owner-approved catalog listing stays public without exposing its
-- private originating thread, member name, conversations, or activity titles.
create table public.community_catalog_public(
 id text primary key references public.community_catalog_additions(id) on delete cascade,
 name text not null,url text not null,category text not null,description text not null,
 access_label text not null,checked_at date not null,published boolean not null default true
);
alter table public.community_catalog_public enable row level security;
revoke all on public.community_catalog_public from public,anon,authenticated;
grant select on public.community_catalog_public to anon,authenticated;
grant all on public.community_catalog_public to service_role;
create policy approved_catalog_listings on public.community_catalog_public for select to anon,authenticated using(published);
create function community_private.sync_catalog_public(p_id text) returns void language plpgsql security invoker set search_path='' as $$begin
 insert into public.community_catalog_public(id,name,url,category,description,access_label,checked_at,published)
  select a.id,a.name,a.url,a.category,a.description,a.access_label,a.checked_at,true
  from public.community_catalog_additions a join public.community_threads t on t.id=a.source_thread_id
  where a.id=p_id and a.published and t.status='published'
  on conflict(id) do update set name=excluded.name,url=excluded.url,category=excluded.category,description=excluded.description,access_label=excluded.access_label,checked_at=excluded.checked_at,published=true;
 if not found then delete from public.community_catalog_public where id=p_id;end if;
end;$$;
create function community_private.catalog_public_event() returns trigger language plpgsql security invoker set search_path='' as $$begin
 if TG_OP='DELETE' then perform community_private.sync_catalog_public(old.id);return old;end if;
 perform community_private.sync_catalog_public(new.id);return new;
end;$$;
create function community_private.catalog_public_thread_event() returns trigger language plpgsql security invoker set search_path='' as $$declare item record;begin
 for item in select id from public.community_catalog_additions where source_thread_id=new.id loop perform community_private.sync_catalog_public(item.id);end loop;
 return new;
end;$$;
revoke all on function community_private.sync_catalog_public(text),community_private.catalog_public_event(),community_private.catalog_public_thread_event() from public,anon,authenticated;
grant execute on function community_private.sync_catalog_public(text),community_private.catalog_public_event(),community_private.catalog_public_thread_event() to service_role;
create trigger community_catalog_public_sync after insert or update or delete on public.community_catalog_additions for each row execute function community_private.catalog_public_event();
create trigger community_catalog_public_thread_sync after update of status on public.community_threads for each row when(old.status is distinct from new.status) execute function community_private.catalog_public_thread_event();
insert into public.community_catalog_public(id,name,url,category,description,access_label,checked_at,published)
 select a.id,a.name,a.url,a.category,a.description,a.access_label,a.checked_at,true from public.community_catalog_additions a join public.community_threads t on t.id=a.source_thread_id where a.published and t.status='published';
commit;
