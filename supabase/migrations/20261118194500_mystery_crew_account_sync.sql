begin;
-- New Mystery Crew Creator replaces the old avatar display. No old avatar data is
-- copied, awarded, or deleted. Each approved member receives one starter Scout.
create table if not exists public.community_mystery_crews(
  user_id uuid primary key references public.community_members(user_id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  constraint mystery_crew_state_shape check(
    jsonb_typeof(state)='object'
    and state->>'version'='1'
    and jsonb_typeof(state->'crew')='array'
    and jsonb_array_length(state->'crew') between 1 and 6
    and jsonb_typeof(state->'unlocked')='array'
    and jsonb_array_length(state->'unlocked') between 1 and 65
    and octet_length(state::text)<=19000
  )
);
alter table public.community_mystery_crews enable row level security;
revoke all on public.community_mystery_crews from public,anon,authenticated;
grant select,insert,update on public.community_mystery_crews to authenticated;
grant all on public.community_mystery_crews to service_role;

-- Approved family members can see each other's displayed crew; only the
-- owning member can insert or edit their own state.
create policy mystery_crews_family_select
on public.community_mystery_crews for select to authenticated
using(
  exists(select 1 from public.community_members actor
         where actor.user_id=(select auth.uid()) and actor.status='approved'
           and actor.role in ('owner','member'))
  and exists(select 1 from public.community_members subject
         where subject.user_id=community_mystery_crews.user_id and subject.status='approved'
           and subject.role in ('owner','member'))
);
create policy mystery_crews_owner_insert
on public.community_mystery_crews for insert to authenticated
with check(user_id=(select auth.uid())
  and exists(select 1 from public.community_members m
        where m.user_id=(select auth.uid()) and m.status='approved'
          and m.role in ('owner','member')));
create policy mystery_crews_owner_update
on public.community_mystery_crews for update to authenticated
using(user_id=(select auth.uid())
  and exists(select 1 from public.community_members m
        where m.user_id=(select auth.uid()) and m.status='approved'
          and m.role in ('owner','member')))
with check(user_id=(select auth.uid())
  and exists(select 1 from public.community_members m
        where m.user_id=(select auth.uid()) and m.status='approved'
          and m.role in ('owner','member')));

-- Authored version-one starter state. Reset old characters and old unlockables
-- in the new system only. Does not touch old tables or game achievements.
create or replace function community_private.mystery_default(p_name text default 'Scout')
returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object(
 'version',1,'crew',jsonb_build_array(jsonb_build_object(
 'id','crew-1','name','Scout','skin','#f0b989','hair','#904b28',
 'shirt','#ef792f','pants','#315b93','outfit','detective',
 'hat','none','gear','none','pet','dog','vehicle','van',
 'scene','sunlit','expression','smile')),
 'active','crew-1','coins',60,'xp',0,
 'unlocked',jsonb_build_array('detective','explorer','outdoors','fedora','cap',
 'binoculars','dog','cat','van','sunlit'),
 'rewardedDesigns',jsonb_build_array()
 );
$$;
revoke all on function community_private.mystery_default(text) from public,anon,authenticated;

insert into public.community_mystery_crews(user_id,state)
select m.user_id,community_private.mystery_default('Scout')
from public.community_members m
where m.status='approved' and m.role in ('owner','member')
on conflict(user_id) do nothing;

-- New family approvals receive a starter server row automatically. This is a
-- private trigger, not a browser-callable privileged API.
create or replace function community_private.mystery_on_member_approval()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='approved' and new.role in ('owner','member') then
   insert into public.community_mystery_crews(user_id,state)
   values(new.user_id,community_private.mystery_default('Scout'))
   on conflict(user_id) do nothing;
 end if;
 return new;
end;
$$;
revoke all on function community_private.mystery_on_member_approval() from public,anon,authenticated;
create trigger community_mystery_approve_member
after insert or update of status,role on public.community_members
for each row execute function community_private.mystery_on_member_approval();
commit;
