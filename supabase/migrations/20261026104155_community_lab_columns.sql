begin;
alter table public.community_threads
  add column post_kind text not null default 'discussion' check(post_kind in ('discussion','request','discovery','review','project','challenge','poll')),
  add column post_data jsonb not null default '{}'::jsonb check(jsonb_typeof(post_data)='object' and octet_length(post_data::text)<=8000),
  add column accepted_reply_id uuid references public.community_replies(id) on delete set null,
  add column human_reply_count integer not null default 0 check(human_reply_count>=0),
  add column helpful_count integer not null default 0 check(helpful_count>=0),
  add column poll_counts jsonb not null default '[]',
  add column discovery_status text not null default 'submitted' check(discovery_status in ('submitted','reviewing','added','needs-check')),
  add column reviewed_site_id text references public.community_site_totals(site_id),
  add column featured boolean not null default false,
  add column challenge_week date unique,
  add column challenge_ends_at timestamptz;
create index community_threads_kind_feed on public.community_threads(post_kind,created_at desc) where status='published';
create index community_threads_site_public on public.community_threads(site_id,created_at desc) where status='published';
create index community_threads_unanswered on public.community_threads(created_at desc) where status='published' and post_kind='request' and human_reply_count=0;
create index community_threads_accepted on public.community_threads(accepted_reply_id) where accepted_reply_id is not null;
create index community_threads_reviewed_site on public.community_threads(reviewed_site_id) where reviewed_site_id is not null;

commit;
