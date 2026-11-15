-- Show approved family pet species to support consent-based swap offers. No direct table exposure.
BEGIN;
CREATE OR REPLACE FUNCTION public.community_avatar_pet_trade_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare viewer uuid:=community_private.avatar_reward_viewer();
begin
 return jsonb_build_object(
  'family',coalesce((select jsonb_agg(jsonb_build_object('id',user_id,'name',display_name)
    order by display_name) from public.community_members
    where status='approved' and user_id<>viewer),'[]'::jsonb),
  'family_pets',coalesce((select jsonb_agg(jsonb_build_object(
     'member_id',pet.member_id,'cosmetic_id',pet.cosmetic_id,
     'name',pet.name,'bond',pet.bond
   ) order by member.display_name,pet.cosmetic_id)
   from community_private.avatar_pet pet
   join public.community_members member on member.user_id=pet.member_id
   where member.status='approved' and pet.member_id<>viewer),'[]'::jsonb),
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
end;$function$
;
COMMIT;
