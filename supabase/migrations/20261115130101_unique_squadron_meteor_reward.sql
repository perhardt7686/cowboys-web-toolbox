-- Preserve the original Meteor Shower prize. Star Squadron gets its own unique meteor reward.
BEGIN;
insert into community_private.avatar_reward_cosmetic(id,slot,achievement_id,name,tags,position)
 overriding system value values
 ('squadron-meteor-rain','effect','fleet-gunner','Squadron Meteor Rain',
  array['arcade','retro','mystery']::text[],294)
on conflict(id) do nothing;
select setval('community_private.avatar_reward_cosmetic_position_seq'::regclass,
 (select max(position) from community_private.avatar_reward_cosmetic),true);
select setval('community_private.avatar_reward_achievement_position_seq'::regclass,
 (select max(position) from community_private.avatar_reward_achievement),true);
select setval('community_private.avatar_reward_requirement_position_seq'::regclass,
 (select max(position) from community_private.avatar_reward_requirement),true);
COMMIT;
