-- All mutations pass through a JWT-verified Edge Function. Browser keys cannot write.
begin;
create table public.community_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 36),
  role text not null default 'member' check(role in ('member','owner')),
  status text not null default 'pending' check(status in ('pending','approved','declined','suspended')),
  rules_version text not null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
create table public.community_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  title text not null check(char_length(title) between 8 and 140),
  body text not null check(char_length(body) between 12 and 6000),
  category text not null check(category in ('discoveries','help','repair','creative','feedback')),
  site_id text,
  status text not null default 'published' check(status in ('published','held','hidden')),
  locked boolean not null default false,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index community_threads_feed on public.community_threads(status,created_at desc);
alter table public.community_threads add column search_document tsvector generated always as (to_tsvector('simple',coalesce(title,'')||' '||coalesce(body,'')||' '||coalesce(author_name,''))) stored;
create index community_threads_search on public.community_threads using gin(search_document);
create table public.community_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  author_kind text not null default 'member' check(author_kind in ('member','edward')),
  body text not null check(char_length(body) between 1 and 6000),
  status text not null default 'published' check(status in ('published','held','hidden')),
  created_at timestamptz not null default now(),
  check(author_kind<>'edward' or (author_id is null and author_name='Edward'))
);
create index community_replies_thread on public.community_replies(thread_id,created_at);
create index community_members_reviewer on public.community_members(reviewed_by);
create index community_threads_author on public.community_threads(author_id);
create index community_replies_author on public.community_replies(author_id);
create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  reply_id uuid references public.community_replies(id) on delete cascade,
  reason text not null check(reason in ('spam','privacy','abuse','broken-link','other')),
  details text not null default '' check(char_length(details)<=2000),
  status text not null default 'open' check(status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create table public.community_approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  email_status text not null default 'pending' check(email_status in ('pending','sent','failed')),
  created_at timestamptz not null default now()
);
create index community_reports_reporter on public.community_reports(reporter_id);
create index community_reports_thread on public.community_reports(thread_id);
create index community_reports_reply on public.community_reports(reply_id);
create table public.community_audit (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  subject_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.community_rate_limits (
  bucket text primary key,
  started_at timestamptz not null,
  attempts integer not null default 1
);
create index community_audit_actor on public.community_audit(actor_id);
create table public.community_deletion_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending','completed')),
  created_at timestamptz not null default now()
);
alter table public.community_members enable row level security;
alter table public.community_threads enable row level security;
alter table public.community_replies enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_approvals enable row level security;
alter table public.community_audit enable row level security;
alter table public.community_rate_limits enable row level security;
alter table public.community_deletion_requests enable row level security;
create policy published_threads on public.community_threads for select to anon,authenticated using(status='published');
create policy published_replies on public.community_replies for select to anon,authenticated using(status='published' and exists(select 1 from public.community_threads t where t.id=thread_id and t.status='published'));
create policy own_membership on public.community_members for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.community_members,public.community_threads,public.community_replies,public.community_reports,public.community_approvals,public.community_audit,public.community_rate_limits,public.community_deletion_requests from anon,authenticated;
grant select on public.community_threads,public.community_replies to anon,authenticated;
grant select on public.community_members to authenticated;
grant all on public.community_members,public.community_threads,public.community_replies,public.community_reports,public.community_approvals,public.community_audit,public.community_rate_limits,public.community_deletion_requests to service_role;
grant usage,select on sequence public.community_audit_id_seq to service_role;

create function public.community_claim_action(p_bucket text,p_window_seconds integer,p_limit integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare affected integer;
begin
  if p_window_seconds<1 or p_limit<1 then raise exception 'Invalid rate limit'; end if;
  insert into public.community_rate_limits(bucket,started_at,attempts) values(p_bucket,now(),1)
  on conflict(bucket) do update set
    attempts=case when public.community_rate_limits.started_at<now()-make_interval(secs=>p_window_seconds) then 1 else public.community_rate_limits.attempts+1 end,
    started_at=case when public.community_rate_limits.started_at<now()-make_interval(secs=>p_window_seconds) then now() else public.community_rate_limits.started_at end
  where public.community_rate_limits.started_at<now()-make_interval(secs=>p_window_seconds) or public.community_rate_limits.attempts<p_limit;
  get diagnostics affected=row_count;
  return affected=1;
end $$;
revoke all on function public.community_claim_action(text,integer,integer) from public,anon,authenticated;
grant execute on function public.community_claim_action(text,integer,integer) to service_role;

create function public.community_review_member(p_actor uuid,p_user uuid,p_decision text,p_token_hash text default null)
returns boolean language plpgsql security invoker set search_path='' as $$
declare affected integer;
begin
  if p_decision not in ('approved','declined') then raise exception 'Invalid decision'; end if;
  if not exists(select 1 from public.community_members where user_id=p_actor and role='owner' and status='approved') then raise exception 'Owner required'; end if;
  if p_actor=p_user then raise exception 'Cannot review yourself'; end if;
  if p_token_hash is not null then
    update public.community_approvals set consumed_at=now() where user_id=p_user and token_hash=p_token_hash and consumed_at is null and expires_at>now();
    get diagnostics affected=row_count;
    if affected<>1 then raise exception 'Review link expired or already used'; end if;
  end if;
  update public.community_members set status=p_decision,reviewed_at=now(),reviewed_by=p_actor where user_id=p_user and role='member' and status='pending';
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Request already reviewed'; end if;
  update public.community_approvals set consumed_at=coalesce(consumed_at,now()) where user_id=p_user;
  insert into public.community_audit(actor_id,action,subject_id) values(p_actor,'membership.'||p_decision,p_user);
  return true;
end $$;
revoke all on function public.community_review_member(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.community_review_member(uuid,uuid,text,text) to service_role;
commit;
