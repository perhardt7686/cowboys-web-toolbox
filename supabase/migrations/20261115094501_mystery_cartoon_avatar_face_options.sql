-- Add original 1970s mystery-cartoon character face, outfit and expression options.
-- Existing member recipes are padded with free defaults; no saved profile is overwritten.
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
      join community_private.avatar_reward_earned unlocked on unlocked.achievement_id=cosmetic.achievement_id
      where cosmetic.slot=part.key and cosmetic.id=(checked->'cosmetics'->>part.key) and unlocked.member_id=p_member
    )
  ) then
    raise exception 'Earn each cosmetic before saving it in an outfit' using errcode='42501';
  end if;
  return checked;
end;
$function$
;
