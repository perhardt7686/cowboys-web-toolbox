-- Pet trades: rewards remain with earners; actual companion inventory transfers.
-- Preserve legacy recipes, prevent re-minting, update equipped/preset outfits.
BEGIN;
CREATE OR REPLACE FUNCTION community_private.avatar_reward_recipe(p_member uuid, p_recipe jsonb, p_legacy boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  choices constant jsonb := '{
    "skin":["porcelain","sand","amber","copper","deep","espresso","tan","bisque"],
    "hair":["brown","black","blonde","auburn","silver","purple","chestnut","red","grey","pale"],
    "style":["short","wavy","curly","long","spiky","bald","braids","bun","locs","bob","part","crop","shaved","coils","ponytail"],
    "eyes":["brown","blue","green","hazel","grey","amber","black"],
    "shirt":["violet","teal","rose","gold","navy","forest","cream","rust","sky","plum","olive","black"],
    "background":["lavender","sunset","ocean","mint","night","cloud","sand","rose","heather","sky","peach"],
    "accessory":["none","glasses","freckles","headphones","crown","earrings","scarf","bowtie","badge"],
    "brows":["soft","straight","bold","arching"],
    "beard":["none","stubble","beard","moustache","goatee"],
    "expression":["smile","grin","calm","wink","curious"],
    "pose":["center","tilt","wave"],
    "face":["oval","angular","round","square","long","heart"],
    "nose":["button","straight","swoop","pointed","freckled"],
    "cheeks":["plain","rosy","dimples","freckles"],
    "garment":["collared","striped","cardigan","sweater","denim","vest","turtleneck"],
    "hat":["none","cap","beanie","western","beret"],
    "glasses":["none","round","square","oval"]
  }';
  legacy_defaults constant jsonb := '{"brows":"soft","beard":"none","expression":"smile","pose":"center","hat":"none","glasses":"none","cosmetics":{},"face":"oval","nose":"button","cheeks":"plain","garment":"collared"}';
  checked jsonb := p_recipe;
begin
  if p_recipe is null or jsonb_typeof(p_recipe)<>'object' or octet_length(p_recipe::text)>3072 then
    raise exception 'Choose a valid family character design' using errcode='22023';
  end if;
  -- All existing saved recipes remain valid without requiring an avatar reset.
  -- New face choices are always free; cosmetics remain server-locked.
  checked := legacy_defaults || p_recipe;
  if exists (
    select 1 from jsonb_object_keys(checked) field(key) where field.key<>'cosmetics' and not (choices ? field.key)
  ) or exists (
    select 1 from jsonb_each(choices) choice
    where (jsonb_typeof(checked->choice.key)='string' and choice.value ? (checked->>choice.key)) is not true
  ) or jsonb_typeof(checked->'cosmetics') is distinct from 'object' then
    raise exception 'Choose a valid family character design' using errcode='22023';
  end if;
  if p_legacy and checked->'cosmetics'<>'{}'::jsonb then
    raise exception 'The older character can only use starter options' using errcode='22023';
  end if;
  if exists (
    select 1 from jsonb_each(checked->'cosmetics') part
    where jsonb_typeof(part.value)<>'string' or not exists (
      select 1 from community_private.avatar_reward_cosmetic cosmetic
      where cosmetic.slot=part.key and cosmetic.id=(checked->'cosmetics'->>part.key)
      and (
        -- Existing game-earned items remain unchanged.
        (cosmetic.slot<>'companion' and exists (
          select 1 from community_private.avatar_reward_earned unlocked
          where unlocked.achievement_id=cosmetic.achievement_id and unlocked.member_id=p_member
        ))
        or (cosmetic.slot='companion' and (
          -- A received pet is legitimately owned, even without its earning trophy.
          exists(select 1 from community_private.avatar_pet adopted
            where adopted.member_id=p_member and adopted.cosmetic_id=cosmetic.id)
          or (
            -- Backward-compatible: allow eligible, not-yet-adopted pet previews.
            not exists(select 1 from community_private.avatar_pet_claim claimed
              where claimed.member_id=p_member and claimed.cosmetic_id=cosmetic.id)
            and exists(select 1 from community_private.avatar_reward_earned unlocked
              where unlocked.achievement_id=cosmetic.achievement_id and unlocked.member_id=p_member)
          )
        ))
      )
    )
  ) then
    raise exception 'Earn each cosmetic before saving it in an outfit' using errcode='42501';
  end if;
  return checked;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.community_avatar_reward_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  viewer uuid := community_private.avatar_reward_viewer();
  metrics jsonb := community_private.avatar_reward_metrics(viewer);
  saved community_private.avatar_reward_current%rowtype;
  legacy jsonb;
begin
  perform community_private.avatar_reward_award(viewer,metrics);
  select * into saved from community_private.avatar_reward_current where member_id=viewer;
  if saved.recipe is null then
    select details->'avatar_recipe' into legacy from public.community_profile_preferences where user_id=viewer;
  end if;
  return jsonb_build_object(
    'loadout',coalesce(saved.recipe,legacy),'active',coalesce(saved.active,false),'revision',coalesce(saved.revision,0),
    'plate_access',exists(select 1 from public.community_plate_players where user_id=viewer),
    'outfits',community_private.avatar_reward_outfits(viewer),
    'catalog',(select coalesce(jsonb_agg(jsonb_build_object(
      'id',c.id,'slot',c.slot,'name',c.name,'achievement_id',c.achievement_id,'tags',c.tags
    ) order by c.position),'[]'::jsonb) from community_private.avatar_reward_cosmetic c),
    'earned',(select coalesce(jsonb_agg(jsonb_build_object(
      'id',v.id,'awarded_at',v.awarded_at,'seen',v.seen
    ) order by v.awarded_at desc,v.position),'[]'::jsonb)
      from (
        select c.id,c.position,e.awarded_at,e.seen_at is not null as seen
        from community_private.avatar_reward_earned e
        join community_private.avatar_reward_cosmetic c on c.achievement_id=e.achievement_id
        where e.member_id=viewer and (
          c.slot<>'companion'
          or exists(select 1 from community_private.avatar_pet p
            where p.member_id=viewer and p.cosmetic_id=c.id)
          or not exists(select 1 from community_private.avatar_pet_claim claimed
            where claimed.member_id=viewer and claimed.cosmetic_id=c.id)
        )
        union all
        select c.id,c.position,p.acquired_at as awarded_at,true as seen
        from community_private.avatar_pet p
        join community_private.avatar_reward_cosmetic c on c.id=p.cosmetic_id
        where p.member_id=viewer and not exists(
          select 1 from community_private.avatar_reward_earned e
          where e.member_id=viewer and e.achievement_id=c.achievement_id
        )
      ) v),
    'achievements',(select coalesce(jsonb_agg(jsonb_build_object(
      'id',a.id,'name',a.name,'tier',a.tier,'group',a.group_id,'match',a.match_type,'earned_at',e.awarded_at,
      'requirements',(select jsonb_agg(jsonb_build_object(
        'game',m.game,'label',m.label,'target',r.target,'current',coalesce((metrics->>m.id)::bigint,0)
      ) order by r.position) from community_private.avatar_reward_requirement r
        join community_private.avatar_reward_metric m on m.id=r.metric_id where r.achievement_id=a.id)
    ) order by a.position),'[]'::jsonb)
      from community_private.avatar_reward_achievement a
      left join community_private.avatar_reward_earned e on e.achievement_id=a.id and e.member_id=viewer)
  );
end;
$function$
;
CREATE OR REPLACE FUNCTION public.community_avatar_pet_trade_offer(p_to uuid, p_pet text, p_request text DEFAULT NULL::text, p_revision bigint DEFAULT NULL::bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 if p_revision is not null and pet.revision<>p_revision then
   raise exception 'Pet details changed. Refresh before offering a trade.' using errcode='40001';
 end if;
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
end;$function$
;
CREATE OR REPLACE FUNCTION public.community_avatar_pet_trade_action(p_trade uuid, p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 -- A traded pet must also disappear from the sender's SAVED outfits.
 -- Keep every other choice untouched, and preserve the owner’s achievement.
 update community_private.avatar_reward_outfit
 set recipe=jsonb_set(recipe,'{cosmetics}',coalesce(recipe->'cosmetics','{}'::jsonb)-'companion',true),
 updated_at=now()
 where (member_id=offer.from_member and recipe->'cosmetics'->>'companion'=offer.offered_pet)
    or (member_id=offer.to_member and recipe->'cosmetics'->>'companion'=offer.requested_pet);
 update community_private.avatar_pet_trade
  set status='accepted',decided_at=now() where id=p_trade;
 update public.community_family_revisions set revision=revision+1,changed_at=clock_timestamp()
  where topic='scores';
 return jsonb_build_object('status','accepted','received',offer.offered_pet,
   'exchanged',offer.requested_pet);
end;$function$
;
COMMIT;
