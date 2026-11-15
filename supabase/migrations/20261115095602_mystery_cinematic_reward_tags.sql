begin;
-- Cinematic location and effect tags match the original renderer catalog.
update community_private.avatar_reward_cosmetic set tags=array['mystery','retro','cinematic']::text[] where id in ('foggy-marsh','velvet-theater','roadside-motel','moon-boardwalk','rocket-hangar','ivy-library','glowing-footprints','mystery-echo-rings','comet-trails','dream-bubbles','stormlight-bolts','tiny-ghost-parade') and slot in ('background','effect');
commit;
