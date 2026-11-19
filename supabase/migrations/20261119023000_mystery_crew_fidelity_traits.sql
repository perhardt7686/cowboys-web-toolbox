-- Add independently customizable face, hair, eye and expression traits to the
-- existing protected Mystery Crew JSON. Existing accounts and game data remain intact.
alter table community_private.mystery_crew_state alter column crew set default '[{"id":"crew-1","name":"Scout","skin":"#f0b989","hair":"#904b28","shirt":"#ef792f","pants":"#315b93","outfit":"detective","hat":"none","gear":"none","pet":"dog","vehicle":"van","scene":"sunlit","faceShape":"oval","hairStyle":"tousled","eyeShape":"bright","detail":"none","expression":"smile"}]'::jsonb;

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
    if not(coalesce(item->>'faceShape','oval')=any(array['oval','round','heart','square','narrow','broad']))
      or not(coalesce(item->>'hairStyle','tousled')=any(array['tousled','bob','side-sweep','curls','crop','long']))
      or not(coalesce(item->>'eyeShape','bright')=any(array['bright','almond','soft','keen']))
      or not(coalesce(item->>'detail','none')=any(array['none','glasses','headband','freckles']))
      or not(coalesce(item->>'expression','smile')=any(array['smile','curious','grin','determined','surprised'])) then
      raise exception 'Choose a supported character appearance' using errcode='22023';
    end if;
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
      'faceShape',coalesce(item->>'faceShape','oval'),
      'hairStyle',coalesce(item->>'hairStyle','tousled'),
      'eyeShape',coalesce(item->>'eyeShape','bright'),
      'detail',coalesce(item->>'detail','none'),
      'expression',coalesce(item->>'expression','smile')
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
