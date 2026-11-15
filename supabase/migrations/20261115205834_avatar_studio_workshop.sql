begin;

-- The workshop edition adds a catalog while old loadouts, achievements and
-- pet instances remain available to saved looks and the existing trade APIs.
insert into community_private.avatar_reward_achievement(id,name,tier,group_id,match_type,position)
overriding system value values
  ('studio-welcome','Open the Workshop','starter','family','all',1000),
  ('studio-refit','Backlot Detectives','starter','wordquest','all',1001)
on conflict (id) do nothing;

insert into community_private.avatar_reward_requirement(achievement_id,metric_id,target,position)
overriding system value values ('studio-refit','quest-clue-days',1,1000)
on conflict (achievement_id,metric_id) do nothing;

insert into community_private.avatar_reward_cosmetic(id,slot,achievement_id,name,tags,position)
overriding system value values
  ('studio-observatory-telescope','prop','fleet-scout','Brass Field Telescope',array['studio-collection','observatory'],1000),
  ('studio-observatory-coat','outerwear','fleet-scout','Astronomer’s Coat',array['studio-collection','observatory'],1001),
  ('studio-observatory-pack','back','fleet-scout','Star Chart Satchel',array['studio-collection','observatory'],1002),
  ('studio-observatory-moth','companion','fleet-scout','Lamplight Moth',array['studio-collection','observatory'],1003),
  ('studio-observatory-scene','background','fleet-scout','Observatory Terrace',array['studio-collection','observatory'],1004),
  ('studio-rain-lantern','prop','maze-sleuth','Puddle Lantern',array['studio-collection','rain'],1005),
  ('studio-rain-cape','outerwear','maze-sleuth','Patchwork Storm Cape',array['studio-collection','rain'],1006),
  ('studio-rain-boots','footwear','maze-sleuth','Puddle Waders',array['studio-collection','rain'],1007),
  ('studio-rain-hound','companion','maze-sleuth','Gutter Fog Hound',array['studio-collection','rain'],1008),
  ('studio-rain-scene','background','maze-sleuth','Lamplit Alley',array['studio-collection','rain'],1009),
  ('studio-workshop-visor','bodypart','fleet-gunner','Carnival Scanner Plate',array['studio-collection','workshop','robot'],1010),
  ('studio-workshop-gloves','hands','fleet-gunner','Workshop Claw Gloves',array['studio-collection','workshop','robot'],1011),
  ('studio-workshop-belt','waist','fleet-gunner','Sprocket Utility Belt',array['studio-collection','workshop'],1012),
  ('studio-workshop-gremlin','companion','fleet-gunner','Midway Wind-up Gremlin',array['studio-collection','workshop'],1013),
  ('studio-workshop-scene','background','fleet-gunner','Midway Workshop',array['studio-collection','workshop'],1014),
  ('studio-tower-lantern','prop','maze-shadow','Watch Bell Lantern',array['studio-collection','tower'],1015),
  ('studio-tower-cape','outerwear','maze-shadow','Tower Sentry Mantle',array['studio-collection','tower'],1016),
  ('studio-tower-gloves','hands','maze-shadow','Bell Ringer’s Gloves',array['studio-collection','tower'],1017),
  ('studio-tower-gargoyle','companion','maze-shadow','Slatewing Gargoyle',array['studio-collection','tower'],1018),
  ('studio-tower-scene','background','maze-shadow','Belfry Lookout',array['studio-collection','tower'],1019),
  ('studio-backlot-flashlight','prop','studio-refit','Backlot Flashlight',array['studio-collection','backlot'],1020),
  ('studio-backlot-compass','offhand','studio-refit','Clue-Seeker Compass',array['studio-collection','backlot'],1021),
  ('studio-backlot-jacket','outerwear','studio-refit','Marquee Jacket',array['studio-collection','backlot'],1022),
  ('studio-backlot-glasses','eyewear','studio-refit','Dusk Cat-Eye Glasses',array['studio-collection','backlot'],1023),
  ('studio-backlot-scene','background','studio-refit','Dusk Backlot',array['studio-collection','backlot'],1024),
  ('studio-attic-ghost','companion','studio-welcome','Wick the Attic Ghost',array['studio-collection','starter','ghost'],1025)
on conflict (id) do nothing;

create table if not exists community_private.avatar_studio_release_receipt (
  member_id uuid not null references public.community_members(user_id) on delete cascade,
  edition integer not null,
  saved_character jsonb,
  saved_outfits jsonb not null,
  replacement_achievement text not null references community_private.avatar_reward_achievement(id),
  converted_at timestamptz not null default now(),
  primary key (member_id,edition)
);
alter table community_private.avatar_studio_release_receipt enable row level security;
revoke all on community_private.avatar_studio_release_receipt from public,anon,authenticated;

-- No prior result is marked as earned by this conversion. The new replacement
-- achievement is applied once to the approved members who had old rewards.
insert into community_private.avatar_studio_release_receipt(member_id,edition,saved_character,saved_outfits,replacement_achievement)
select m.user_id,2,to_jsonb(c),coalesce((
  select jsonb_agg(to_jsonb(o) order by o.slot)
  from community_private.avatar_reward_outfit o where o.member_id=m.user_id
),'[]'::jsonb),'studio-refit'
from public.community_members m
left join community_private.avatar_reward_current c on c.member_id=m.user_id
where m.status='approved' and (
  exists(
    select 1 from community_private.avatar_reward_earned e
    join community_private.avatar_reward_cosmetic old on old.achievement_id=e.achievement_id
    where e.member_id=m.user_id and not ('studio-collection'=any(old.tags))
      and (old.slot<>'companion'
        or not exists(select 1 from community_private.avatar_pet_claim h
          where h.member_id=m.user_id and h.cosmetic_id=old.id))
  )
  or exists(select 1 from community_private.avatar_pet p
    join community_private.avatar_reward_cosmetic old on old.id=p.cosmetic_id
    where p.member_id=m.user_id and not ('studio-collection'=any(old.tags)))
)
on conflict (member_id,edition) do nothing;

insert into community_private.avatar_reward_earned(member_id,achievement_id,seen_at)
select member_id,replacement_achievement,now()
from community_private.avatar_studio_release_receipt where edition=2
on conflict (member_id,achievement_id) do nothing;

insert into community_private.avatar_reward_earned(member_id,achievement_id,seen_at)
select user_id,'studio-welcome',now() from public.community_members where status='approved'
on conflict (member_id,achievement_id) do nothing;

CREATE OR REPLACE FUNCTION community_private.avatar_reward_recipe(p_member uuid, p_recipe jsonb, p_legacy boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  choices constant jsonb := '{"skin":["porcelain","sand","amber","copper","deep","espresso","tan","bisque"],"hair":["brown","black","blonde","auburn","silver","purple","chestnut","red","grey","pale","teal","coral","lime"],"style":["short","wavy","curly","long","spiky","bald","braids","bun","locs","bob","part","crop","shaved","coils","ponytail","shag","flip","pompadour","afro","fringe","feathered"],"eyes":["brown","blue","green","hazel","grey","amber","black","violet","aqua"],"shirt":["violet","teal","rose","gold","navy","forest","cream","rust","sky","plum","olive","black","burntorange","turquoise","maroon","lime"],"background":["lavender","sunset","ocean","mint","night","cloud","sand","rose","heather","sky","peach","sunflower","ochre","moss"],"accessory":["none","glasses","freckles","headphones","crown","earrings","scarf","bowtie","badge"],"brows":["soft","straight","bold","arching"],"beard":["none","stubble","beard","moustache","goatee"],"expression":["smile","grin","calm","wink","curious","smirk","laugh","determined"],"pose":["center","tilt","wave"],"face":["oval","angular","round","square","long","heart"],"nose":["button","straight","swoop","pointed","freckled"],"cheeks":["plain","rosy","dimples","freckles"],"garment":["collared","striped","cardigan","sweater","denim","vest","turtleneck","jacket","jumpsuit","hoodie","safari"],"hat":["none","cap","beanie","western","beret"],"glasses":["none","round","square","oval","aviator","cat-eye","retro-square"],"eye_shape":["classic","round","almond","wide","sleepy","dramatic"]}';
  legacy_defaults constant jsonb := '{"brows":"soft","beard":"none","expression":"smile","pose":"center","hat":"none","glasses":"none","cosmetics":{},"face":"oval","nose":"button","cheeks":"plain","garment":"collared","eye_shape":"classic"}';
  body_choices constant jsonb := '{"model":["detective","mechanic","sleuth","specter","armor","marsh","automaton","scout","radio"],"bottoms":["flares","slacks","pleats","dress","overalls","cuffs"],"footwear":["loafers","boots","highboots","sneakers","maryjanes"],"outerwear":["none","denim","trench","raincoat","cape"],"neckwear":["none","ascot","scarf","pendant"],"waist":["none","leather","utility"],"hands":["none","gloves","gauntlets"],"back":["none","satchel","pack"],"height":["-2","-1","0","1","2"],"build":["-2","-1","0","1","2"],"jaw":["-2","-1","0","1","2"],"eye_spacing":["-2","-1","0","1","2"]}';
  checked jsonb := p_recipe;
  fitted jsonb;
  chosen_family text;
begin
  if p_recipe is null or jsonb_typeof(p_recipe)<>'object' or octet_length(p_recipe::text)>3072 then
    raise exception 'Choose a valid family character design' using errcode='22023';
  end if;
  -- All existing saved recipes remain valid without requiring an avatar reset.
  -- New face choices are always free; cosmetics remain server-locked.
  checked := legacy_defaults || p_recipe;
  if exists (
    select 1 from jsonb_object_keys(checked) field(key) where field.key not in ('cosmetics','full_body') and not (choices ? field.key)
  ) or exists (
    select 1 from jsonb_each(choices) choice
    where (jsonb_typeof(checked->choice.key)='string' and choice.value ? (checked->>choice.key)) is not true
  ) or jsonb_typeof(checked->'cosmetics') is distinct from 'object' then
    raise exception 'Choose a valid family character design' using errcode='22023';
  end if;
  fitted := checked->'full_body';
  if checked ? 'full_body' then
    if jsonb_typeof(fitted) is distinct from 'object' then
      raise exception 'Choose a valid full-body wardrobe' using errcode='22023';
    end if;
    if exists(
      select 1 from jsonb_each(fitted) field
      where (jsonb_typeof(field.value)='string' and body_choices->field.key ? (fitted->>field.key)) is not true
    ) then
      raise exception 'Choose a valid full-body wardrobe' using errcode='22023';
    end if;
  end if;
  chosen_family := case
    when fitted->>'model' in ('specter','armor','marsh') then 'monster'
    when fitted->>'model' in ('automaton','scout','radio') then 'robot'
    else 'human'
  end;
  if p_legacy and checked->'cosmetics'<>'{}'::jsonb then
    raise exception 'The older character can only use starter options' using errcode='22023';
  end if;
  if exists (
    select 1 from jsonb_each(checked->'cosmetics') part
    where jsonb_typeof(part.value)<>'string' or not exists (
      select 1 from community_private.avatar_reward_cosmetic cosmetic
      where cosmetic.slot=part.key and cosmetic.id=(checked->'cosmetics'->>part.key)
      and (
        chosen_family=any(cosmetic.tags)
        or (cosmetic.slot<>'bodypart' and (
          not ('studio-collection'=any(cosmetic.tags))
          or not (cosmetic.tags && array['human','monster','robot'])
        ))
      )
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
  -- Every approved member gets the first companion once. Keep the grant
  -- in the existing ledger so adoption, ownership and trades share one path.
  insert into community_private.avatar_reward_earned(member_id,achievement_id,seen_at)
    values (viewer,'studio-welcome',now())
    on conflict (member_id,achievement_id) do nothing;
  perform community_private.avatar_reward_award(viewer,metrics);
  select * into saved from community_private.avatar_reward_current where member_id=viewer;
  if saved.recipe is null then
    select details->'avatar_recipe' into legacy from public.community_profile_preferences where user_id=viewer;
  end if;
  return jsonb_build_object(
    'catalog_version',2,
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

commit;
