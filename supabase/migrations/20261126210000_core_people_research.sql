-- Core's existing shared owner/editor helper remains the access boundary.
create table public.cowboys_core_people_cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default public.cowboys_core_data_owner(),
  created_by uuid not null default auth.uid(),
  title text not null check (length(title) between 1 and 160),
  kind text not null check (kind in ('name','username','email')),
  query text not null check (length(query) between 3 and 120 and query=btrim(query) and query !~ '[[:cntrl:]<>"/\\]'),
  notes text not null default '' check (length(notes)<=10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,owner_id)
);
create index cowboys_core_people_cases_owner_date on public.cowboys_core_people_cases(owner_id,created_at desc);

create table public.cowboys_core_people_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  case_id uuid not null,
  requested_by uuid not null,
  client_request_id uuid not null,
  status text not null default 'queued' check (status in ('queued','running','finished','partial','timed_out','failed','cancelled','interrupted')),
  engine_revision text,
  engine_status text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  unique (id,owner_id),
  unique (owner_id,client_request_id),
  foreign key(case_id,owner_id) references public.cowboys_core_people_cases(id,owner_id) on delete cascade
);
create index cowboys_core_people_runs_case_date on public.cowboys_core_people_runs(case_id,created_at desc);
create unique index cowboys_core_people_one_active on public.cowboys_core_people_runs(owner_id) where status in ('queued','running');

create table public.cowboys_core_people_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  owner_id uuid not null,
  event_type text not null check(length(event_type)<=80),
  source_url text not null check(length(source_url)<=2048 and source_url ~ '^https://[^/@[:space:]]+'),
  source_name text not null check(length(source_name)<=160),
  observed_at timestamptz not null,
  association text not null default 'unverified' check(association='unverified'),
  review_state text not null default 'unreviewed' check(review_state in ('unreviewed','possible_match','different_person')),
  review_note text not null default '' check(length(review_note)<=2000),
  foreign key(run_id,owner_id) references public.cowboys_core_people_runs(id,owner_id) on delete cascade
);
create unique index cowboys_core_people_finding_source on public.cowboys_core_people_findings(run_id,md5(source_url));
create index cowboys_core_people_findings_owner_run on public.cowboys_core_people_findings(owner_id,run_id);

create table public.cowboys_core_people_rate_log (
  owner_id uuid not null,
  request_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(owner_id,request_id)
);
create index cowboys_core_people_rate_date on public.cowboys_core_people_rate_log(owner_id,created_at desc);

create table public.cowboys_core_people_config (
  singleton boolean primary key default true check(singleton),
  engine_url text check(engine_url ~ '^https://[a-z0-9][a-z0-9-]*\.onrender\.com$'),
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.cowboys_core_people_config(singleton) values(true);

alter table public.cowboys_core_people_cases enable row level security;
alter table public.cowboys_core_people_runs enable row level security;
alter table public.cowboys_core_people_findings enable row level security;
alter table public.cowboys_core_people_rate_log enable row level security;
alter table public.cowboys_core_people_config enable row level security;

create policy people_cases_select on public.cowboys_core_people_cases for select to authenticated using(owner_id=(select public.cowboys_core_data_owner()));
create policy people_cases_insert on public.cowboys_core_people_cases for insert to authenticated with check(owner_id=(select public.cowboys_core_data_owner()) and created_by=(select auth.uid()));
create policy people_cases_update on public.cowboys_core_people_cases for update to authenticated using(owner_id=(select public.cowboys_core_data_owner())) with check(owner_id=(select public.cowboys_core_data_owner()));
create policy people_cases_delete on public.cowboys_core_people_cases for delete to authenticated using(owner_id=(select public.cowboys_core_data_owner()));
create policy people_runs_select on public.cowboys_core_people_runs for select to authenticated using(owner_id=(select public.cowboys_core_data_owner()));
create policy people_findings_select on public.cowboys_core_people_findings for select to authenticated using(owner_id=(select public.cowboys_core_data_owner()));
create policy people_findings_review on public.cowboys_core_people_findings for update to authenticated using(owner_id=(select public.cowboys_core_data_owner())) with check(owner_id=(select public.cowboys_core_data_owner()));

revoke all on public.cowboys_core_people_cases,public.cowboys_core_people_runs,public.cowboys_core_people_findings,public.cowboys_core_people_rate_log,public.cowboys_core_people_config from public,anon,authenticated;
grant select,delete on public.cowboys_core_people_cases to authenticated;
grant insert(title,kind,query,notes),update(title,notes) on public.cowboys_core_people_cases to authenticated;
grant select on public.cowboys_core_people_runs,public.cowboys_core_people_findings to authenticated;
grant update(review_state,review_note) on public.cowboys_core_people_findings to authenticated;
grant all on public.cowboys_core_people_cases,public.cowboys_core_people_runs,public.cowboys_core_people_findings,public.cowboys_core_people_rate_log,public.cowboys_core_people_config to service_role;

grant select,delete on public.cowboys_core_people_cases to authenticated;
grant insert(title,kind,query,notes),update(title,notes) on public.cowboys_core_people_cases to authenticated;
grant select on public.cowboys_core_people_runs,public.cowboys_core_people_findings to authenticated;
grant update(review_state,review_note) on public.cowboys_core_people_findings to authenticated;

create function public.cowboys_core_people_touch() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end;
$$;
revoke all on function public.cowboys_core_people_touch() from public,anon,authenticated;
create trigger people_case_updated before update on public.cowboys_core_people_cases for each row execute function public.cowboys_core_people_touch();

create function public.cowboys_core_people_begin_run(p_case_id uuid,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_owner uuid:=public.cowboys_core_data_owner(); v_run public.cowboys_core_people_runs%rowtype;
begin
  if v_owner is null or auth.uid() is null then raise exception 'core_access_required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_owner::text,0));
  if not exists(select 1 from public.cowboys_core_people_cases c where c.id=p_case_id and c.owner_id=v_owner) then
    raise exception 'case_not_found' using errcode='P0002';
  end if;
  select * into v_run from public.cowboys_core_people_runs r where r.owner_id=v_owner and r.client_request_id=p_request_id;
  if found then
    if v_run.case_id<>p_case_id then raise exception 'request_case_mismatch' using errcode='22023'; end if;
    return to_jsonb(v_run);
  end if;
  update public.cowboys_core_people_runs set status='interrupted',finished_at=now()
    where owner_id=v_owner and status in ('queued','running') and created_at<now()-interval '8 minutes';
  if exists(select 1 from public.cowboys_core_people_runs r where r.owner_id=v_owner and r.status in ('queued','running')) then
    raise exception 'scan_already_active' using errcode='P0001';
  end if;
  if exists(select 1 from public.cowboys_core_people_rate_log l where l.owner_id=v_owner and l.request_id=p_request_id) then
    raise exception 'request_expired' using errcode='22023';
  end if;
  if (select count(*) from public.cowboys_core_people_rate_log l where l.owner_id=v_owner and l.created_at>now()-interval '1 hour')>=3
     or (select count(*) from public.cowboys_core_people_rate_log l where l.owner_id=v_owner and l.created_at>now()-interval '24 hours')>=12 then
    raise exception 'scan_limit_reached' using errcode='P0001';
  end if;
  delete from public.cowboys_core_people_rate_log where owner_id=v_owner and created_at<now()-interval '30 days';
  if (select count(*) from public.cowboys_core_people_rate_log l where l.owner_id=v_owner and l.created_at>now()-interval '1 hour')>=3
    or (select count(*) from public.cowboys_core_people_rate_log l where l.owner_id=v_owner and l.created_at>now()-interval '24 hours')>=12 then
    raise exception 'scan_rate_limited' using errcode='P0001';
  end if;
  if (select count(*) from public.cowboys_core_people_rate_log l where l.owner_id=v_owner and l.created_at>now()-interval '1 hour')>=3
    or (select count(*) from public.cowboys_core_people_rate_log l where l.owner_id=v_owner and l.created_at>now()-interval '1 day')>=12 then
    raise exception 'scan_rate_limited' using errcode='P0001';
  end if;
  insert into public.cowboys_core_people_rate_log(owner_id,request_id) values(v_owner,p_request_id);
  insert into public.cowboys_core_people_runs(owner_id,case_id,requested_by,client_request_id)
    values(v_owner,p_case_id,auth.uid(),p_request_id) returning * into v_run;
  return to_jsonb(v_run);
end;
$$;

create function public.cowboys_core_people_scan_payload(p_run_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare v_owner uuid:=public.cowboys_core_data_owner(); v_payload jsonb;
begin
  if v_owner is null then raise exception 'core_access_required' using errcode='42501'; end if;
  select jsonb_build_object('owner_id',r.owner_id,'kind',c.kind,'query',c.query) into v_payload
    from public.cowboys_core_people_runs r join public.cowboys_core_people_cases c on c.id=r.case_id and c.owner_id=r.owner_id
    where r.id=p_run_id and r.owner_id=v_owner and r.status in ('queued','running') and r.created_at>now()-interval '5 minutes';
  if v_payload is null then raise exception 'run_not_available' using errcode='P0002'; end if;
  return v_payload;
end;
$$;

create function public.cowboys_core_people_finish_run(p_run_id uuid,p_status text,p_engine_status text,p_revision text,p_findings jsonb default '[]'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_run public.cowboys_core_people_runs%rowtype; v_finding jsonb;
begin
  if p_status='finished' and p_engine_status is distinct from 'FINISHED' then raise exception 'engine_not_finished'; end if;
  if p_status not in ('finished','partial','timed_out','failed','cancelled','interrupted') then raise exception 'invalid_status'; end if;
  if jsonb_typeof(p_findings)<>'array' or jsonb_array_length(p_findings)>100 then raise exception 'invalid_findings'; end if;
  select * into v_run from public.cowboys_core_people_runs r where r.id=p_run_id for update;
  if not found then raise exception 'run_not_found' using errcode='P0002'; end if;
  if v_run.status not in ('queued','running') then return to_jsonb(v_run); end if;
  for v_finding in select value from jsonb_array_elements(p_findings) loop
    if v_finding->>'event_type' not in ('ACCOUNT_EXTERNAL_OWNED','ACCOUNT_EXTERNAL_USER_SHARED','ACCOUNT_EXTERNAL_USER_SHARED_COMPROMISED') then continue; end if;
    insert into public.cowboys_core_people_findings(run_id,owner_id,event_type,source_url,source_name,observed_at)
      values(v_run.id,v_run.owner_id,left(v_finding->>'event_type',80),v_finding->>'source_url',
        left(coalesce(v_finding->>'source_name','Public profile'),160),(v_finding->>'observed_at')::timestamptz)
      on conflict do nothing;
  end loop;
  update public.cowboys_core_people_runs set status=p_status,engine_status=left(p_engine_status,100),
    engine_revision=left(p_revision,64),finished_at=now() where id=v_run.id returning * into v_run;
  return to_jsonb(v_run);
end;
$$;
revoke all on function public.cowboys_core_people_begin_run(uuid,uuid),public.cowboys_core_people_scan_payload(uuid),public.cowboys_core_people_finish_run(uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.cowboys_core_people_begin_run(uuid,uuid),public.cowboys_core_people_scan_payload(uuid) to authenticated;
grant execute on function public.cowboys_core_people_finish_run(uuid,text,text,text,jsonb) to service_role;
