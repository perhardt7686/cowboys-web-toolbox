alter table public.community_dash_levels drop constraint if exists community_dash_levels_pattern_check;
alter table public.community_dash_levels add constraint community_dash_levels_pattern_check
 check(length(pattern) between 24 and 90 and pattern ~ '^[.sbglwcpfrmodh]+$');