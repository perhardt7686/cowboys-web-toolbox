begin;

-- Accept bounded, optional sculpt controls in the existing avatar recipe.
-- Previous saved specifications and all existing ownership checks still apply.
CREATE OR REPLACE FUNCTION community_private.avatar_reward_recipe(p_member uuid, p_recipe jsonb, p_legacy boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  choices constant jsonb := '{"skin":["porcelain","sand","amber","copper","deep","espresso","tan","bisque"],"hair":["brown","black","blonde","auburn","silver","purple","chestnut","red","grey","pale","teal","coral","lime"],"style":["short","wavy","curly","long","spiky","bald","braids","bun","locs","bob","part","crop","shaved","coils","ponytail","shag","flip","pompadour","afro","fringe","feathered"],"eyes":["brown","blue","green","hazel","grey","amber","black","violet","aqua"],"shirt":["violet","teal","rose","gold","navy","forest","cream","rust","sky","plum","olive","black","burntorange","turquoise","maroon","lime"],"background":["lavender","sunset","ocean","mint","night","cloud","sand","rose","heather","sky","peach","sunflower","ochre","moss"],"accessory":["none","glasses","freckles","headphones","crown","earrings","scarf","bowtie","badge"],"brows":["soft","straight","bold","arching"],"beard":["none","stubble","beard","moustache","goatee"],"expression":["smile","grin","calm","wink","curious","smirk","laugh","determined"],"pose":["center","tilt","wave"],"face":["oval","angular","round","square","long","heart"],"nose":["button","straight","swoop","pointed","freckled"],"cheeks":["plain","rosy","dimples","freckles"],"garment":["collared","striped","cardigan","sweater","denim","vest","turtleneck","jacket","jumpsuit","hoodie","safari"],"hat":["none","cap","beanie","western","beret"],"glasses":["none","round","square","oval","aviator","cat-eye","retro-square"],"eye_shape":["classic","round","almond","wide","sleepy","dramatic"]}';
  legacy_defaults constant jsonb := '{"brows":"soft","beard":"none","expression":"smile","pose":"center","hat":"none","glasses":"none","cosmetics":{},"face":"oval","nose":"button","cheeks":"plain","garment":"collared","eye_shape":"classic"}';
  body_choices constant jsonb := '{"model":["detective","mechanic","sleuth","specter","armor","automaton","scout"],"bottoms":["flares","slacks","pleats","dress","overalls","cuffs"],"footwear":["loafers","boots","highboots","sneakers","maryjanes"],"outerwear":["none","denim","trench","raincoat","cape"],"neckwear":["none","ascot","scarf","pendant"],"waist":["none","leather","utility"],"hands":["none","gloves","gauntlets"],"back":["none","satchel","pack"],"height":["-2","-1","0","1","2"],"build":["-2","-1","0","1","2"],"jaw":["-2","-1","0","1","2"],"eye_spacing":["-2","-1","0","1","2"]}';
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
    when fitted->>'model' in ('specter','armor') then 'monster'
    when fitted->>'model' in ('automaton','scout') then 'robot'
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
      and (cosmetic.slot<>'bodypart' or chosen_family=any(cosmetic.tags))
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

commit;
