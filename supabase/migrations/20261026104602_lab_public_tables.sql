begin;
create table public.community_site_reports(
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.community_members(user_id) on delete cascade,
  site_id text not null references public.community_site_totals(site_id),
  reason text not null check(reason in ('broken','price','signup','misleading','other')),
  details text not null check(char_length(details) between 5 and 2000),
  status text not null default 'open' check(status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index community_site_reports_reporter on public.community_site_reports(reporter_id);
create index community_site_reports_site on public.community_site_reports(site_id);
create index community_site_reports_open on public.community_site_reports(created_at) where status='open';
create table public.community_site_activity(
  site_id text primary key references public.community_site_totals(site_id),
  thread_count integer not null default 0,
  reply_count integer not null default 0,
  worked_count integer not null default 0,
  paid_count integer not null default 0,
  problem_count integer not null default 0,
  last_thread_id uuid,
  last_title text,
  updated_at timestamptz not null default now()
);
create table public.community_catalog_additions(
  id text primary key references public.community_site_totals(site_id),
  name text not null check(char_length(name) between 2 and 80),
  url text not null check(url ~ '^https://[^/@[:space:]]+' and char_length(url)<=500),
  canonical_host text not null unique check(char_length(canonical_host) between 3 and 253),
  category text not null check(category in ('Utilities','Creative','Learning','Games','Movies & media','Travel','Shopping','Maps & world','Repair & vehicles')),
  description text not null check(char_length(description) between 12 and 240),
  source_thread_id uuid not null unique references public.community_threads(id),
  credit_name text,
  access_label text not null default 'Community find · check access' check(char_length(access_label)<=100),
  checked_at date not null default current_date,
  published boolean not null default true
);
create index community_catalog_source on public.community_catalog_additions(source_thread_id);
alter table public.community_site_reports enable row level security;
revoke all on public.community_site_reports from public,anon,authenticated;
grant all on public.community_site_reports to service_role;
alter table public.community_site_activity enable row level security;
revoke all on public.community_site_activity from public,anon,authenticated;
grant all on public.community_site_activity to service_role;
alter table public.community_catalog_additions enable row level security;
revoke all on public.community_catalog_additions from public,anon,authenticated;
grant all on public.community_catalog_additions to service_role;
commit;
