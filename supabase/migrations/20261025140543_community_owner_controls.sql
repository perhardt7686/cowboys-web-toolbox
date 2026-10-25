begin;
create table public.community_settings (
  id text primary key check(id='community'),announcement_text text not null default '' check(char_length(announcement_text)<=500),
  announcement_enabled boolean not null default false,updated_at timestamptz not null default now()
);
insert into public.community_settings(id) values('community');
alter table public.community_settings enable row level security;
create policy visible_announcement on public.community_settings for select to anon,authenticated using(announcement_enabled and announcement_text<>'');
revoke all on public.community_settings from public,anon,authenticated;
grant select on public.community_settings to anon,authenticated;grant all on public.community_settings to service_role;
create function public.community_set_announcement(p_actor uuid,p_text text,p_enabled boolean)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result public.community_settings%rowtype;
begin
  if not exists(select 1 from public.community_members where user_id=p_actor and role='owner' and status='approved') then raise exception 'Owner required'; end if;
  update public.community_settings set announcement_text=btrim(p_text),announcement_enabled=p_enabled,updated_at=now() where id='community' returning * into result;
  insert into public.community_audit(actor_id,action,details) values(p_actor,'announcement.updated',jsonb_build_object('enabled',p_enabled));
  return to_jsonb(result);
end;$$;
create index community_members_owner_list on public.community_members(status,created_at desc);
create function public.community_bulk_member_status(p_actor uuid,p_users uuid[],p_status text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare changed uuid[];
begin
  if not exists(select 1 from public.community_members where user_id=p_actor and role='owner' and status='approved') then raise exception 'Owner required'; end if;
  if coalesce(array_length(p_users,1),0) not between 1 and 20 or p_status not in ('approved','declined','suspended') then raise exception 'Invalid member selection'; end if;
  with updates as (
    update public.community_members set status=p_status,reviewed_by=p_actor,reviewed_at=now()
    where user_id=any(p_users) and role='member' and user_id<>p_actor and status<>p_status and (p_status<>'declined' or status='pending') returning user_id
  ) select array_agg(user_id) into changed from updates;
  update public.community_approvals set consumed_at=coalesce(consumed_at,now()) where user_id=any(changed);
  insert into public.community_audit(actor_id,action,subject_id,details)
    select p_actor,'moderation.member',id,jsonb_build_object('status',p_status,'bulk',true) from unnest(changed) id;
  return jsonb_build_object('updated',coalesce(array_length(changed,1),0),'user_ids',coalesce(changed,'{}'::uuid[]));
end;$$;
create function public.community_admin_members(p_actor uuid,p_search text default '',p_status text default 'all',p_offset integer default 0)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
  if not exists(select 1 from public.community_members where user_id=p_actor and role='owner' and status='approved') then raise exception 'Owner required'; end if;
  if p_status not in ('all','pending','approved','suspended','declined') or char_length(p_search)>80 or p_offset not between 0 and 10000 then raise exception 'Invalid member filter'; end if;
  with filtered as (select user_id,display_name,role,status,created_at from public.community_members where (p_status='all' or status=p_status) and position(lower(p_search) in lower(display_name))>0),
  page as (select * from filtered order by created_at desc,user_id limit 25 offset p_offset)
  select jsonb_build_object('total',(select count(*) from filtered),'members',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb),'offset',p_offset) into result;
  return result;
end;$$;

revoke all on function public.community_set_announcement(uuid,text,boolean),public.community_bulk_member_status(uuid,uuid[],text),public.community_admin_members(uuid,text,text,integer) from public,anon,authenticated;grant execute on function public.community_set_announcement(uuid,text,boolean),public.community_bulk_member_status(uuid,uuid[],text),public.community_admin_members(uuid,text,text,integer) to service_role;
commit;
