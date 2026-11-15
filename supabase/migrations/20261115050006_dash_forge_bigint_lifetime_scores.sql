-- Points can exceed 32-bit totals over an effectively endless campaign.
alter table public.community_dash_profiles
 alter column player_points type bigint,
 alter column designer_points type bigint;