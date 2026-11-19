-- Mystery Crew Creator: authoritative new character system.
-- Old avatar tables are deliberately not referenced or modified. Game results
-- remain intact; old avatar RPCs are retired only after all consumers migrate.
create table if not exists community_private.mystery_crew_state (
  member_id uuid primary key references public.community_members(user_id) on delete cascade,
  crew jsonb not null default '[{"id":"crew-1","name":"Scout","skin":"#f0b989","hair":"#904b28","shirt":"#ef792f","pants":"#315b93","outfit":"detective","hat":"none","gear":"none","pet":"dog","vehicle":"van","scene":"sunlit","expression":"smile"}]'::jsonb,
  active text not null default 'crew-1',
  coins integer not null default 60 check (coins between 0 and 99999),
  xp integer not null default 0 check (xp between 0 and 999999),
  unlocked text[] not null default array['detective','explorer','outdoors','fedora','cap','binoculars','dog','cat','van','sunlit']::text[],
  rewarded_designs text[] not null default '{}'::text[],
  revision bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint mystery_crew_array check (jsonb_typeof(crew)='array' and jsonb_array_length(crew) between 1 and 6 and octet_length(crew::text)<=9000)
);
revoke all on community_private.mystery_crew_state from public,anon,authenticated;
alter table community_private.mystery_crew_state enable row level security;

create or replace function community_private.ensure_mystery_crew_member()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status='approved' then
    insert into community_private.mystery_crew_state(member_id) values (new.user_id)
      on conflict (member_id) do nothing;
  end if;
  return new;
end $$;
revoke all on function community_private.ensure_mystery_crew_member() from public,anon,authenticated;
drop trigger if exists mystery_crew_member_bootstrap on public.community_members;
create trigger mystery_crew_member_bootstrap
  after insert or update of status on public.community_members
  for each row execute function community_private.ensure_mystery_crew_member();

-- Cowboy explicitly requested a basic new-system character for all existing
-- approved accounts. This does not delete memberships or historical game scores.
insert into community_private.mystery_crew_state(member_id)
  select user_id from public.community_members where status='approved'
  on conflict (member_id) do nothing;

create or replace function public.community_mystery_crew_state()
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare viewer uuid := auth.uid(); saved community_private.mystery_crew_state%rowtype;
begin
  if viewer is null or not exists
    (select 1 from public.community_members where user_id=viewer and status='approved') then
    raise exception 'Approved family membership required' using errcode='42501';
  end if;
  insert into community_private.mystery_crew_state(member_id) values(viewer)
    on conflict(member_id) do nothing;
  select * into saved from community_private.mystery_crew_state where member_id=viewer;
  return jsonb_build_object('version',1,'crew',saved.crew,'active',saved.active,
    'coins',saved.coins,'xp',saved.xp,'unlocked',to_jsonb(saved.unlocked),
    'rewardedDesigns',to_jsonb(saved.rewarded_designs),'revision',saved.revision);
end $$;
revoke all on function public.community_mystery_crew_state() from public,anon;
grant execute on function public.community_mystery_crew_state() to authenticated;

create or replace function public.community_mystery_crew_portraits(p_members uuid[])
returns table (user_id uuid, character jsonb)
language plpgsql stable security definer set search_path='' as $$
declare viewer uuid := auth.uid();
begin
  if viewer is null or not exists(select 1 from public.community_members where user_id=viewer and status='approved') then
    raise exception 'Approved family membership required' using errcode='42501';
  end if;
  if coalesce(cardinality(p_members),0)>100 then
    raise exception 'At most 100 crew portraits' using errcode='22023';
  end if;
  return query
    select s.member_id,
    coalesce((select c.elem from jsonb_array_elements(s.crew) as c(elem)
      where c.elem->>'id'=s.active limit 1),s.crew->0)
    from community_private.mystery_crew_state s
    join public.community_members m on m.user_id=s.member_id and m.status='approved'
    where s.member_id=any(p_members);
end $$;
revoke all on function public.community_mystery_crew_portraits(uuid[]) from public,anon;
grant execute on function public.community_mystery_crew_portraits(uuid[]) to authenticated;

create or replace function public.community_mystery_crew_save(
  p_crew jsonb,p_active text,p_expected bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  viewer uuid := auth.uid();
  saved community_private.mystery_crew_state%rowtype;
  item jsonb; normalized jsonb:='[]'::jsonb;
  seen text[]:='{}'::text[];
  item_id text; field text; selection text;
  new_name text; new_color text;
  key text;
  known_outfits text[]:=array['detective','explorer','viking','pilot','space','knight','outdoors','stealth'];
  known_hats text[]:=array['none','fedora','helmet','goggles','cap'];
  known_gear text[]:=array['none','binoculars','flashlight','compass','pack'];
  known_pets text[]:=array['dog','cat','ghost','owl','fox'];
  known_vehicles text[]:=array['van','jeep','camper'];
  known_scenes text[]:=array['sunlit','twilight','autumn'];
begin
  if viewer is null or not exists(select 1 from public.community_members where user_id=viewer and status='approved') then
    raise exception 'Approved family membership required' using errcode='42501';
  end if;
  if jsonb_typeof(p_crew) is distinct from 'array'
      or jsonb_array_length(p_crew) not between 1 and 6
      or octet_length(p_crew::text)>9000 then
    raise exception 'Choose 1 to 6 valid crew characters' using errcode='22023';
  end if;
  insert into community_private.mystery_crew_state(member_id) values(viewer)
    on conflict(member_id) do nothing;
  select * into saved from community_private.mystery_crew_state where member_id=viewer for update;
  if p_expected is distinct from saved.revision then
    raise exception 'Your crew changed on another device. Refresh first.' using errcode='40001';
  end if;
  for item in select value from jsonb_array_elements(p_crew) loop
    if jsonb_typeof(item)<>'object' then
      raise exception 'Invalid crew character' using errcode='22023';
    end if;
    item_id := coalesce(item->>'id','');
    new_name:=btrim(coalesce(item->>'name',''));
    if item_id !~ '^crew-[a-zA-Z0-9-]{1,18}$'
      or item_id=any(seen)
      or char_length(new_name) not between 1 and 28 then
      raise exception 'Invalid or duplicated character' using errcode='22023';
    end if;
    seen:=array_append(seen,item_id);
    if not(coalesce(item->>'outfit','')=any(known_outfits)) then
      raise exception 'Invalid outfit' using errcode='22023';
    end if;
    if not(item->>'hat'=any(known_hats)) or not(item->>'gear'=any(known_gear))
      or not(item->>'pet'=any(known_pets)) or not(item->>'vehicle'=any(known_vehicles))
      or not(item->>'scene'=any(known_scenes)) then
      raise exception 'Unrecognized pet or equipment' using errcode='22023';
    end if;
    foreach field in array array['outfit','hat','gear','pet','vehicle','scene'] loop
      selection := item->>field;
      if selection<>'none' and not(selection=any(saved.unlocked)) then
        raise exception 'Unlock this item before equipping it' using errcode='42501';
      end if;
    end loop;
    foreach field in array array['skin','hair','shirt','pants'] loop
      new_color:=item->>field;
      if new_color is null or new_color !~ '^#[0-9a-fA-F]{6}$' then
        raise exception 'Choose a valid color' using errcode='22023';
      end if;
    end loop;
    normalized := normalized||jsonb_build_array(jsonb_build_object(
      'id',item_id,'name',new_name,'skin',item->>'skin','hair',item->>'hair',
      'shirt',item->>'shirt','pants',item->>'pants',
      'outfit',item->>'outfit','hat',item->>'hat','gear',item->>'gear',
      'pet',item->>'pet','vehicle',item->>'vehicle','scene',item->>'scene',
      'expression',case when item->>'expression'=any(array['smile','curious','grin'])
        then item->>'expression' else 'smile' end
    ));
  end loop;
  if p_active is null or not(p_active=any(seen)) then
    raise exception 'Choose an existing active character' using errcode='22023';
  end if;
  key:='look:'||md5(normalized::text);
  update community_private.mystery_crew_state
    set crew=normalized,active=p_active,
      coins=least(99999,saved.coins+case when not(key=any(saved.rewarded_designs)) and cardinality(saved.rewarded_designs)<200 then 15 else 0 end),
      xp=least(999999,saved.xp+case when not(key=any(saved.rewarded_designs)) and cardinality(saved.rewarded_designs)<200 then 25 else 0 end),
      rewarded_designs=case when not(key=any(saved.rewarded_designs)) and cardinality(saved.rewarded_designs)<200
        then array_append(saved.rewarded_designs,key) else saved.rewarded_designs end,
      revision=saved.revision+1,updated_at=now()
    where member_id=viewer;
  return public.community_mystery_crew_state();
end $$;
revoke all on function public.community_mystery_crew_save(jsonb,text,bigint) from public,anon;
grant execute on function public.community_mystery_crew_save(jsonb,text,bigint) to authenticated;

create or replace function public.community_mystery_crew_unlock(p_item text,p_expected bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 viewer uuid:=auth.uid();saved community_private.mystery_crew_state%rowtype;price integer;
begin
 if viewer is null or not exists(select 1 from public.community_members where user_id=viewer and status='approved') then
  raise exception 'Approved family membership required' using errcode='42501';
 end if;
 price:=case p_item
  when 'viking' then 110 when 'pilot' then 90 when 'space' then 130
  when 'knight' then 140 when 'stealth' then 100
  when 'helmet' then 75 when 'goggles' then 65
  when 'flashlight' then 40 when 'compass' then 50 when 'pack' then 65
  when 'ghost' then 60 when 'owl' then 75 when 'fox' then 95
  when 'jeep' then 90 when 'camper' then 115
  when 'twilight' then 60 when 'autumn' then 70
  else null end;
 if price is null then
  raise exception 'Item is not available to unlock' using errcode='22023';
 end if;
 select * into saved from community_private.mystery_crew_state where member_id=viewer for update;
 if not found then
  raise exception 'Open Mystery Crew Creator to initialize your account' using errcode='22023';
 end if;
 if p_expected is distinct from saved.revision then
  raise exception 'Your crew changed on another device. Refresh first.' using errcode='40001';
 end if;
 if p_item=any(saved.unlocked) then
  return public.community_mystery_crew_state();
 end if;
 if saved.coins<price then
  raise exception 'Not enough family workshop coins yet' using errcode='22023';
 end if;
 update community_private.mystery_crew_state set
  coins=saved.coins-price,unlocked=array_append(saved.unlocked,p_item),
  revision=saved.revision+1,updated_at=now()
  where member_id=viewer;
 return public.community_mystery_crew_state();
end $$;
revoke all on function public.community_mystery_crew_unlock(text,bigint) from public,anon;
grant execute on function public.community_mystery_crew_unlock(text,bigint) to authenticated;

create or replace function public.community_mystery_crew_motion(p_motion text,p_expected bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare viewer uuid:=auth.uid();saved community_private.mystery_crew_state%rowtype;marker text;
begin
 if viewer is null or not exists(select 1 from public.community_members where user_id=viewer and status='approved') then
  raise exception 'Approved family membership required' using errcode='42501';
 end if;
 if p_motion is null or not(p_motion=any(array['wave','cheer','think','run','action'])) then
  raise exception 'Unknown motion' using errcode='22023';
 end if;
 select * into saved from community_private.mystery_crew_state where member_id=viewer for update;
 if not found then raise exception 'Open your creator account first' using errcode='22023'; end if;
 if p_expected is distinct from saved.revision then
  raise exception 'Your crew changed on another device. Refresh first.' using errcode='40001';
 end if;
 marker:='motion:'||p_motion;
 if not(marker=any(saved.rewarded_designs)) then
  update community_private.mystery_crew_state set
   coins=least(99999,saved.coins+5),xp=least(999999,saved.xp+10),
   rewarded_designs=array_append(saved.rewarded_designs,marker),
   revision=saved.revision+1,updated_at=now()
   where member_id=viewer;
 end if;
 return public.community_mystery_crew_state();
end $$;
revoke all on function public.community_mystery_crew_motion(text,bigint) from public,anon;
grant execute on function public.community_mystery_crew_motion(text,bigint) to authenticated;

-- Never grant direct client writes. Validated RPCs are the only mutation API.
revoke all on community_private.mystery_crew_state from anon,authenticated,public;
