begin;
create table public.community_editorial(
  slug text primary key,
  title text not null check(char_length(title) between 8 and 140),
  body text not null check(char_length(body) between 12 and 6000),
  category text not null check(category in ('discoveries','help','repair','creative','feedback')),
  post_kind text not null default 'discussion' check(post_kind in ('discussion','request','challenge')),
  position integer not null,
  published_thread_id uuid references public.community_threads(id) on delete set null,
  published_at timestamptz
);
create index community_editorial_thread on public.community_editorial(published_thread_id);
create table public.community_worker_capability(
  id text primary key check(id='weekly'),
  token_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);
create table public.community_digest_jobs(
  user_id uuid not null references public.community_members(user_id) on delete cascade,
  week_start date not null,
  status text not null default 'pending' check(status in ('pending','sending','sent','failed','skipped')),
  attempts integer not null default 0 check(attempts between 0 and 2),
  claimed_at timestamptz,
  finished_at timestamptz,
  primary key(user_id,week_start)
);
create index community_digest_queue on public.community_digest_jobs(week_start,status,attempts);
create unique index community_unsubscribe_hash on public.community_preferences(unsubscribe_hash) where unsubscribe_hash is not null;
alter table public.community_editorial enable row level security;
alter table public.community_worker_capability enable row level security;
alter table public.community_digest_jobs enable row level security;
revoke all on public.community_editorial,public.community_worker_capability,public.community_digest_jobs from public,anon,authenticated;
grant all on public.community_editorial,public.community_worker_capability,public.community_digest_jobs to service_role;
alter table public.community_editorial enable row level security;
revoke all on public.community_editorial from public,anon,authenticated;
grant all on public.community_editorial to service_role;
alter table public.community_worker_capability enable row level security;
revoke all on public.community_worker_capability from public,anon,authenticated;
grant all on public.community_worker_capability to service_role;
alter table public.community_digest_jobs enable row level security;
revoke all on public.community_digest_jobs from public,anon,authenticated;
grant all on public.community_digest_jobs to service_role;
commit;
