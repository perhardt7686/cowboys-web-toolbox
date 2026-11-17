-- Additive storage for member-REPORTED classic game scores only.
-- These figures are not emulator verified and MUST NOT earn official trophies,
-- family badges, avatar cosmetics, or replay-backed progression.
create table if not exists public.community_classic_reports(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 game text not null check (game in ('galaga','pacman','centipede','topgear')),
 points integer not null check (points between 1 and 99999999),
 created_at timestamptz not null default now(),
 source text not null default 'member_reported' check (source='member_reported'),
 unique (user_id,game,points)
);
create index if not exists community_classic_reports_rank
 on public.community_classic_reports(game,points desc,created_at asc);
create index if not exists community_classic_reports_owner
 on public.community_classic_reports(user_id,game,created_at desc);
alter table public.community_classic_reports enable row level security;
revoke all on public.community_classic_reports from public,anon,authenticated;
grant select,insert on public.community_classic_reports to authenticated;
drop policy if exists classic_member_reports_read on public.community_classic_reports;
create policy classic_member_reports_read
 on public.community_classic_reports for select to authenticated
 using (exists(select 1 from public.community_members m
  where m.user_id=(select auth.uid()) and m.status='approved'));
drop policy if exists classic_member_reports_create on public.community_classic_reports;
create policy classic_member_reports_create
 on public.community_classic_reports for insert to authenticated
 with check (user_id=(select auth.uid()) and source='member_reported'
  and exists(select 1 from public.community_members m
   where m.user_id=(select auth.uid()) and m.status='approved'));
comment on table public.community_classic_reports is
 'Approved-member self-reported classic scores. NOT emulator verified; never use for entitlement grants.';
