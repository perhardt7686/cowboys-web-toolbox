-- Owner-private pets: one-time adoption and explicit opt-in family exchanges.
-- Trophies/achievements stay with the earner. No money, off-family trades,
-- automatic transfers or email addresses are exposed.
begin;
alter table community_private.avatar_pet
 add column if not exists acquired_at timestamptz not null default now();

create table if not exists community_private.avatar_pet_claim(
 member_id uuid not null references public.community_members(user_id) on delete cascade,
 cosmetic_id text not null references community_private.avatar_reward_cosmetic(id),
 claimed_at timestamptz not null default now(),
 primary key(member_id,cosmetic_id)
);
alter table community_private.avatar_pet_claim enable row level security;
revoke all on community_private.avatar_pet_claim from public,anon,authenticated;
insert into community_private.avatar_pet_claim(member_id,cosmetic_id)
 select member_id,cosmetic_id from community_private.avatar_pet on conflict do nothing;

create table if not exists community_private.avatar_pet_trade(
 id uuid primary key default gen_random_uuid(),
 from_member uuid not null references public.community_members(user_id) on delete cascade,
 to_member uuid not null references public.community_members(user_id) on delete cascade,
 offered_pet text not null references community_private.avatar_reward_cosmetic(id),
 requested_pet text references community_private.avatar_reward_cosmetic(id),
 offered_revision bigint not null,
 status text not null default 'pending'
   check(status in ('pending','accepted','declined','cancelled','expired')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '7 days'),
 decided_at timestamptz,
 check(from_member<>to_member),
 check(requested_pet is null or requested_pet<>offered_pet)
);
alter table community_private.avatar_pet_trade enable row level security;
revoke all on community_private.avatar_pet_trade from public,anon,authenticated;
create unique index if not exists avatar_pet_trade_one_offer_per_pet
 on community_private.avatar_pet_trade(from_member,offered_pet) where status='pending';
create index if not exists avatar_pet_trade_inbox
 on community_private.avatar_pet_trade(to_member,created_at desc);

create or replace function community_private.avatar_pet_action(
 p_cosmetic text,p_action text,p_revision bigint,p_name text
) returns jsonb language plpgsql security definer set search_path='' as $fn$
declare
 viewer uuid:=community_private.avatar_reward_viewer();
 pet community_private.avatar_pet%rowtype;
 pet_name text;
 new_name text:=btrim(p_name);
begin
 if p_action is null or p_action not in ('adopt','pet','play','trick','rename') then
  raise exception 'Choose a pet action' using errcode='22023';
 end if;
 if p_action='adopt' then
  perform pg_advisory_xact_lock(hashtextextended('family-pet:'||viewer::text||':'||p_cosmetic,0));
  select c.name into pet_name from community_private.avatar_reward_cosmetic c
   join community_private.avatar_reward_earned e on e.achievement_id=c.achievement_id
   where c.id=p_cosmetic and c.slot='companion' and e.member_id=viewer;
  if not found then
   raise exception 'Earn this pet before adopting it' using errcode='42501';
  end if;
  select * into pet from community_private.avatar_pet
   where member_id=viewer and cosmetic_id=p_cosmetic for update;
  if not found then
   if exists(select 1 from community_private.avatar_pet_claim
      where member_id=viewer and cosmetic_id=p_cosmetic) then
    raise exception 'You have already adopted and traded this pet. Arrange a family trade to get it back.'
     using errcode='42501';
   end if;
   insert into community_private.avatar_pet_claim(member_id,cosmetic_id)
    values(viewer,p_cosmetic);
   insert into community_private.avatar_pet(member_id,cosmetic_id,name)
    values(viewer,p_cosmetic,left(pet_name,30))
    returning * into pet;
  end if;
 else
  -- A pet legitimately received from family is interactive even if the
  -- recipient has not personally earned the original game achievement.
  select * into pet from community_private.avatar_pet
   where member_id=viewer and cosmetic_id=p_cosmetic for update;
  if not found then raise exception 'Adopt or receive this pet first' using errcode='22023';end if;
  if pet.revision is distinct from p_revision then
   raise exception 'Your pet has a newer update. Reload its details.' using errcode='40001';
  end if;
  if p_action='trick' and pet.bond<6 then
   raise exception 'Build a bond to learn this trick' using errcode='22023';
  end if;
  if p_action='rename' and (new_name is null or char_length(new_name) not between 1 and 30
      or new_name ~ '[[:cntrl:]]') then
   raise exception 'Enter a pet name from 1 to 30 characters' using errcode='22023';
  end if;
  update community_private.avatar_pet
   set name=case when p_action='rename' then new_name else name end,
       bond=least(12,bond+case p_action when 'pet' then 1 when 'play' then 2 when 'trick' then 1 else 0 end),
       revision=revision+1
   where member_id=viewer and cosmetic_id=p_cosmetic returning * into pet;
 end if;
 return to_jsonb(pet)-'member_id';
end;$fn$;

create or replace function public.community_avatar_pet_trade_offer(
 p_to uuid,p_pet text,p_request text default null,p_revision bigint default null
) returns jsonb language plpgsql security definer set search_path='' as $fn$
declare
 viewer uuid:=community_private.avatar_reward_viewer();
 pet community_private.avatar_pet%rowtype;
 sent community_private.avatar_pet_trade%rowtype;
begin
 if p_to=viewer or p_to is null then
  raise exception 'Choose another approved family member' using errcode='22023';
 end if;
 -- One lock per sender prevents races between concurrent offer attempts.
 perform pg_advisory_xact_lock(hashtextextended('family-pet-trades:'||viewer::text,0));
 if not exists(select 1 from public.community_members
     where user_id=p_to and status='approved') then
  raise exception 'Only approved family members can trade pets' using errcode='42501';
 end if;
 if (select count(*) from community_private.avatar_pet_trade
    where from_member=viewer and status='pending' and expires_at>now())>=3 then
  raise exception 'You may have three open trade offers at a time' using errcode='22023';
 end if;
 if exists(select 1 from community_private.avatar_pet_trade
   where from_member=viewer and created_at>now()-interval '60 seconds') then
  raise exception 'Wait a minute before sending another trade offer' using errcode='22023';
 end if;
 select * into pet from community_private.avatar_pet
  where member_id=viewer and cosmetic_id=p_pet for update;
 if not found then raise exception 'You can only offer a pet you currently own' using errcode='42501';end if;
 if exists(select 1 from community_private.avatar_pet
  where member_id=p_to and cosmetic_id=p_pet) then
  raise exception 'That member already owns this kind of pet' using errcode='22023';
 end if;
 if p_request is not null and (
  p_request=p_pet or not exists(select 1 from community_private.avatar_pet
   where member_id=p_to and cosmetic_id=p_request)
  or exists(select 1 from community_private.avatar_pet
   where member_id=viewer and cosmetic_id=p_request)
 ) then
  raise exception 'Requested exchange pet is not available' using errcode='22023';
 end if;
 update community_private.avatar_pet_trade set status='expired',decided_at=now()
  where from_member=viewer and status='pending' and expires_at<=now();
 insert into community_private.avatar_pet_trade(from_member,to_member,offered_pet,requested_pet,offered_revision)
  values(viewer,p_to,p_pet,p_request,pet.revision) returning * into sent;
 return jsonb_build_object('id',sent.id,'status',sent.status,'offered_pet',sent.offered_pet,
   'requested_pet',sent.requested_pet,'expires_at',sent.expires_at);
end;$fn$;
revoke all on function public.community_avatar_pet_trade_offer(uuid,text,text,bigint) from public,anon;
grant execute on function public.community_avatar_pet_trade_offer(uuid,text,text,bigint) to authenticated;

create or replace function public.community_avatar_pet_trade_state()
returns jsonb language plpgsql stable security definer set search_path='' as $fn$
declare viewer uuid:=community_private.avatar_reward_viewer();
begin
 return jsonb_build_object(
  'family',coalesce((select jsonb_agg(jsonb_build_object('id',user_id,'name',display_name)
    order by display_name) from public.community_members
    where status='approved' and user_id<>viewer),'[]'::jsonb),
  'offers',coalesce((select jsonb_agg(jsonb_build_object(
    'id',t.id,'direction',case when t.from_member=viewer then 'outgoing' else 'incoming' end,
    'sender',a.display_name,'recipient',b.display_name,
    'offered_pet',t.offered_pet,'requested_pet',t.requested_pet,
    'status',case when t.status='pending' and t.expires_at<=now() then 'expired' else t.status end,
    'created_at',t.created_at,'expires_at',t.expires_at,'decided_at',t.decided_at)
    order by t.created_at desc) from (
    select * from community_private.avatar_pet_trade
    where from_member=viewer or to_member=viewer
    order by created_at desc limit 40
  ) t join public.community_members a on a.user_id=t.from_member
  join public.community_members b on b.user_id=t.to_member),'[]'::jsonb));
end;$fn$;
revoke all on function public.community_avatar_pet_trade_state() from public,anon;
grant execute on function public.community_avatar_pet_trade_state() to authenticated;

create or replace function public.community_avatar_pet_trade_action(
 p_trade uuid,p_action text
) returns jsonb language plpgsql security definer set search_path='' as $fn$
declare viewer uuid:=community_private.avatar_reward_viewer();
 offer community_private.avatar_pet_trade%rowtype;
 outgoing community_private.avatar_pet%rowtype;
 incoming community_private.avatar_pet%rowtype;
 expected text;
begin
 if p_action not in ('accept','decline','cancel') or p_trade is null then
  raise exception 'Choose Accept, Decline or Cancel' using errcode='22023';
 end if;
 select * into offer from community_private.avatar_pet_trade
   where id=p_trade and (from_member=viewer or to_member=viewer) for update;
 if not found then raise exception 'Trade offer not found' using errcode='22023';end if;
 if offer.status<>'pending' then
  raise exception 'This trade offer is already closed' using errcode='22023';
 end if;
 if offer.expires_at<=now() then
  update community_private.avatar_pet_trade set status='expired',decided_at=now() where id=p_trade;
  return jsonb_build_object('status','expired');
 end if;
 if p_action='cancel' and viewer<>offer.from_member then
  raise exception 'Only the sender can cancel an offer' using errcode='42501';
 end if;
 if p_action in ('accept','decline') and viewer<>offer.to_member then
  raise exception 'Only the recipient can accept or decline an offer' using errcode='42501';
 end if;
 if p_action<>'accept' then
  update community_private.avatar_pet_trade
   set status=case when p_action='cancel' then 'cancelled' else 'declined' end,decided_at=now()
   where id=p_trade;
  return jsonb_build_object('status',case when p_action='cancel' then 'cancelled' else 'declined' end);
 end if;
 if not exists(select 1 from public.community_members
   where user_id=offer.from_member and status='approved') or
   not exists(select 1 from public.community_members
   where user_id=offer.to_member and status='approved') then
  raise exception 'Both members must still be approved' using errcode='42501';
 end if;
 -- Deterministic member locks also coordinate with avatar outfit edits.
 if offer.from_member::text < offer.to_member::text then
  perform pg_advisory_xact_lock(hashtextextended('family-avatar:'||offer.from_member::text,0));
  perform pg_advisory_xact_lock(hashtextextended('family-avatar:'||offer.to_member::text,0));
 else
  perform pg_advisory_xact_lock(hashtextextended('family-avatar:'||offer.to_member::text,0));
  perform pg_advisory_xact_lock(hashtextextended('family-avatar:'||offer.from_member::text,0));
 end if;
 select * into outgoing from community_private.avatar_pet
   where member_id=offer.from_member and cosmetic_id=offer.offered_pet for update;
 if not found or outgoing.revision<>offer.offered_revision then
  raise exception 'Offered pet has changed. Ask the sender for a fresh offer.' using errcode='40001';
 end if;
 if exists(select 1 from community_private.avatar_pet
  where member_id=offer.to_member and cosmetic_id=offer.offered_pet) then
  raise exception 'Recipient already owns this kind of pet' using errcode='22023';
 end if;
 if offer.requested_pet is not null then
  select * into incoming from community_private.avatar_pet
    where member_id=offer.to_member and cosmetic_id=offer.requested_pet for update;
  if not found or exists(select 1 from community_private.avatar_pet
    where member_id=offer.from_member and cosmetic_id=offer.requested_pet) then
   raise exception 'The pet requested in exchange is no longer available' using errcode='40001';
  end if;
 end if;
 -- The swap and its status are committed together. Existing names and bonds follow
 -- their pets, while game achievements remain with the original member.
 delete from community_private.avatar_pet
  where member_id=offer.from_member and cosmetic_id=offer.offered_pet;
 if offer.requested_pet is not null then
  delete from community_private.avatar_pet
    where member_id=offer.to_member and cosmetic_id=offer.requested_pet;
 end if;
 insert into community_private.avatar_pet(member_id,cosmetic_id,name,bond,revision,acquired_at)
  values(offer.to_member,outgoing.cosmetic_id,outgoing.name,outgoing.bond,outgoing.revision+1,now());
 if offer.requested_pet is not null then
  insert into community_private.avatar_pet(member_id,cosmetic_id,name,bond,revision,acquired_at)
   values(offer.from_member,incoming.cosmetic_id,incoming.name,incoming.bond,incoming.revision+1,now());
 end if;
 insert into community_private.avatar_pet_claim(member_id,cosmetic_id) values
  (offer.to_member,offer.offered_pet) on conflict do nothing;
 if offer.requested_pet is not null then
  insert into community_private.avatar_pet_claim(member_id,cosmetic_id) values
   (offer.from_member,offer.requested_pet) on conflict do nothing;
 end if;
 -- Never leave a traded-away companion equipped or shown in an old outfit.
 update community_private.avatar_reward_current
  set recipe=jsonb_set(recipe,'{cosmetics}',coalesce(recipe->'cosmetics','{}'::jsonb)-'companion',true),
    revision=revision+1
  where (member_id=offer.from_member and recipe->'cosmetics'->>'companion'=offer.offered_pet)
   or (member_id=offer.to_member and recipe->'cosmetics'->>'companion'=offer.requested_pet);
 update community_private.avatar_pet_trade
  set status='accepted',decided_at=now() where id=p_trade;
 update public.community_family_revisions set revision=revision+1,changed_at=clock_timestamp()
  where topic='scores';
 return jsonb_build_object('status','accepted','received',offer.offered_pet,
   'exchanged',offer.requested_pet);
end;$fn$;
revoke all on function public.community_avatar_pet_trade_action(uuid,text) from public,anon;
grant execute on function public.community_avatar_pet_trade_action(uuid,text) to authenticated;
commit;
