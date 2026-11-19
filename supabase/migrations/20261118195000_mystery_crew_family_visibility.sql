begin;
-- own_membership restricts reads of community_members to the current actor.
-- Keep target approval as server-controlled row metadata, never as an
-- unprivileged subquery against a different member's protected row.
alter table public.community_mystery_crews
  add column approved boolean not null default true;
update public.community_mystery_crews c
set approved=(m.status='approved' and m.role in ('owner','member'))
from public.community_members m where m.user_id=c.user_id;

revoke insert,update on public.community_mystery_crews from authenticated;
grant insert(user_id,state),update(state,updated_at) on public.community_mystery_crews to authenticated;
drop policy if exists mystery_crews_family_select on public.community_mystery_crews;
create policy mystery_crews_family_select
on public.community_mystery_crews for select to authenticated
using(
  approved
  and exists(select 1 from public.community_members actor
    where actor.user_id=(select auth.uid()) and actor.status='approved'
      and actor.role in ('owner','member'))
);
create or replace function community_private.mystery_on_member_approval()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='approved' and new.role in ('owner','member') then
   insert into public.community_mystery_crews(user_id,state,approved)
     values(new.user_id,community_private.mystery_default('Scout'),true)
     on conflict(user_id) do update set approved=true;
 else
   update public.community_mystery_crews set approved=false where user_id=new.user_id;
 end if;
 return new;
end;
$$;
revoke all on function community_private.mystery_on_member_approval() from public,anon,authenticated;
commit;
