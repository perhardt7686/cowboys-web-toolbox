begin;
alter table public.community_choices enable row level security;
alter table public.community_notifications enable row level security;
alter table public.community_preferences enable row level security;
alter table public.community_badges enable row level security;
alter table public.community_site_reports enable row level security;
alter table public.community_site_activity enable row level security;
alter table public.community_catalog_additions enable row level security;
revoke all on public.community_choices,public.community_notifications,public.community_preferences,public.community_badges,public.community_site_reports,public.community_site_activity,public.community_catalog_additions from public,anon,authenticated;
grant select on public.community_choices,public.community_notifications to authenticated;
grant select(user_id,digest_enabled,digest_opted_at,updated_at) on public.community_preferences to authenticated;
grant select on public.community_badges,public.community_site_activity,public.community_catalog_additions to anon,authenticated;
grant all on public.community_choices,public.community_notifications,public.community_preferences,public.community_badges,public.community_site_reports,public.community_site_activity,public.community_catalog_additions to service_role;
create policy choices_own on public.community_choices for select to authenticated using(user_id=(select auth.uid()));
create policy notifications_own on public.community_notifications for select to authenticated using(user_id=(select auth.uid()));
create policy preferences_own on public.community_preferences for select to authenticated using(user_id=(select auth.uid()));
create policy badges_visible on public.community_badges for select to anon,authenticated using(
  active and (user_id=(select auth.uid()) or exists(select 1 from public.community_profiles p where p.user_id=community_badges.user_id and p.published and p.account_active))
  and exists(select 1 from public.community_threads t where t.id=community_badges.thread_id and t.status='published')
);
create policy activity_public on public.community_site_activity for select to anon,authenticated using(true);
create policy additions_public on public.community_catalog_additions for select to anon,authenticated using(published);
commit;
