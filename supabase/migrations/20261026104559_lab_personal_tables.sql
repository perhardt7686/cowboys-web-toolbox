begin;
create table public.community_choices(
  user_id uuid not null references public.community_members(user_id) on delete cascade,
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  helpful boolean not null default false,
  following boolean not null default false,
  saved boolean not null default false,
  poll_choice smallint check(poll_choice between 0 and 5),
  updated_at timestamptz not null default now(),
  primary key(user_id,thread_id)
);
create index community_choices_thread on public.community_choices(thread_id);
create table public.community_notifications(
  user_id uuid not null references public.community_members(user_id) on delete cascade,
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  title text not null,
  last_reply_id uuid references public.community_replies(id) on delete set null,
  unread boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key(user_id,thread_id)
);
create index community_notifications_thread on public.community_notifications(thread_id);
create index community_notifications_inbox on public.community_notifications(user_id,updated_at desc);
create index community_notifications_reply on public.community_notifications(last_reply_id);
create table public.community_preferences(
  user_id uuid primary key references public.community_members(user_id) on delete cascade,
  digest_enabled boolean not null default false,
  digest_opted_at timestamptz,
  unsubscribe_hash text,
  unsubscribe_token text,
  updated_at timestamptz not null default now()
);
create table public.community_badges(
  user_id uuid not null references public.community_members(user_id) on delete cascade,
  badge text not null check(badge in ('Helpful Hand','Trail Finder','Maker')),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  reason text not null check(char_length(reason) between 1 and 200),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key(user_id,badge,thread_id)
);
create index community_badges_thread on public.community_badges(thread_id);
alter table public.community_choices enable row level security;
revoke all on public.community_choices from public,anon,authenticated;
grant all on public.community_choices to service_role;
alter table public.community_notifications enable row level security;
revoke all on public.community_notifications from public,anon,authenticated;
grant all on public.community_notifications to service_role;
alter table public.community_preferences enable row level security;
revoke all on public.community_preferences from public,anon,authenticated;
grant all on public.community_preferences to service_role;
alter table public.community_badges enable row level security;
revoke all on public.community_badges from public,anon,authenticated;
grant all on public.community_badges to service_role;
commit;
