begin;

create table community_private.hot_rod_campaign (
  user_id uuid primary key references public.community_members(user_id) on delete cascade,
  revision integer not null check (revision > 0),
  campaign jsonb not null,
  updated_at timestamptz not null default now()
);
create table community_private.hot_rod_receipt (
  user_id uuid not null references public.community_members(user_id) on delete cascade,
  operation uuid not null,
  revision integer not null,
  message text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operation)
);
create table community_private.hot_rod_result (
  race_id uuid primary key,
  user_id uuid not null references public.community_members(user_id) on delete cascade,
  kind text not null check (kind in ('drag', 'road')),
  rival text not null,
  won boolean not null,
  points int not null check (points between 0 and 150),
  champion boolean not null check (not champion or (won and kind = 'road' and rival = 'king')),
  hours int not null check (hours >= 0),
  elapsed_ms int not null check (elapsed_ms >= 0),
  created_at timestamptz not null default now()
);
create index hot_rod_result_member on community_private.hot_rod_result(user_id);
create table community_private.hot_rod_duel (
  id uuid primary key,
  challenger uuid not null references public.community_members(user_id) on delete cascade,
  challenged uuid not null references public.community_members(user_id) on delete cascade,
  kind text not null check (kind in ('drag','road')),
  seed bigint not null check (seed between 0 and 4294967295),
  status text not null default 'pending' check (status in ('pending','accepted','declined','completed')),
  winner uuid,
  is_tie boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  check (challenger <> challenged),
  check (winner is null or (status = 'completed' and winner in (challenger,challenged) and not is_tie)),
  check (not is_tie or status = 'completed')
);
create index hot_rod_duel_challenger on community_private.hot_rod_duel(challenger,created_at desc);
create index hot_rod_duel_challenged on community_private.hot_rod_duel(challenged,created_at desc);
create table community_private.hot_rod_duel_run (
  duel uuid not null references community_private.hot_rod_duel(id) on delete cascade,
  user_id uuid not null references public.community_members(user_id) on delete cascade,
  race_id uuid not null unique,
  race jsonb not null,
  result jsonb,
  primary key (duel,user_id)
);
alter table community_private.hot_rod_campaign enable row level security;
alter table community_private.hot_rod_receipt enable row level security;
alter table community_private.hot_rod_result enable row level security;
alter table community_private.hot_rod_duel enable row level security;
alter table community_private.hot_rod_duel_run enable row level security;
revoke all on community_private.hot_rod_campaign, community_private.hot_rod_receipt, community_private.hot_rod_result,
  community_private.hot_rod_duel,community_private.hot_rod_duel_run
  from public, anon, authenticated;

create function community_private.hot_rod_approved(p_user uuid)
returns void language plpgsql stable set search_path = ''
as $$
begin
  if p_user is null or not exists (
    select 1 from public.community_members where user_id = p_user and status = 'approved'
  ) then
    raise exception 'Approved family membership required' using errcode = '42501';
  end if;
end;
$$;
revoke all on function community_private.hot_rod_approved(uuid) from public, anon, authenticated;

-- Only the JWT-verifying Edge Function can reach the write path. Members
-- never send a campaign snapshot or score directly to these operations.
create function public.community_hot_rod_read(p_member uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform community_private.hot_rod_approved(p_member);
  return coalesce((
    select jsonb_build_object('revision', revision, 'state', campaign)
    from community_private.hot_rod_campaign where user_id = p_member
  ), jsonb_build_object('revision', 0, 'state', null));
end;
$$;

create function public.community_hot_rod_commit(
  p_member uuid, p_expected integer, p_operation uuid, p_state jsonb, p_message text, p_result jsonb default null
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  saved community_private.hot_rod_campaign%rowtype;
  receipt community_private.hot_rod_receipt%rowtype;
begin
  perform community_private.hot_rod_approved(p_member);
  if p_expected < 0 or p_operation is null or p_state is null or jsonb_typeof(p_state) <> 'object'
    or pg_column_size(p_state) > 96000 or p_message is null or length(p_message) > 240 then
    raise exception 'Invalid campaign operation' using errcode = '22023';
  end if;

  -- Serialize writes for the same membership, including the first insert.
  perform pg_advisory_xact_lock(hashtextextended('hot-rod:' || p_member::text, 0));
  select * into saved from community_private.hot_rod_campaign where user_id = p_member;
  select * into receipt from community_private.hot_rod_receipt where user_id = p_member and operation = p_operation;
  if receipt.operation is not null then
    return jsonb_build_object('revision', saved.revision, 'state', saved.campaign, 'message', receipt.message);
  end if;
  if coalesce(saved.revision, 0) <> p_expected then
    raise exception 'The campaign changed on another screen' using errcode = '40001';
  end if;

  insert into community_private.hot_rod_campaign(user_id, revision, campaign)
  values (p_member, p_expected + 1, p_state)
  on conflict (user_id) do update
    set revision = excluded.revision, campaign = excluded.campaign, updated_at = now();
  insert into community_private.hot_rod_receipt(user_id, operation, revision, message)
  values (p_member, p_operation, p_expected + 1, p_message);
  delete from community_private.hot_rod_receipt
    where user_id = p_member and revision < p_expected - 100 and created_at < now() - interval '7 days';

  if p_result is not null then
    insert into community_private.hot_rod_result(race_id,user_id,kind,rival,won,points,champion,hours,elapsed_ms)
    values (
      (p_result->>'id')::uuid,p_member,p_result->>'kind',p_result->>'rival',(p_result->>'won')::bool,
      (p_result->>'points')::int,(p_result->>'champion')::bool,(p_result->>'hours')::int,(p_result->>'ms')::int
    );
    update public.community_family_revisions set revision = revision + 1, changed_at = clock_timestamp()
      where topic = 'scores';
  end if;
  return jsonb_build_object('revision', p_expected + 1, 'state', p_state, 'message', p_message);
end;
$$;

create function public.community_hot_rod_receipt(p_member uuid, p_operation uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform community_private.hot_rod_approved(p_member);
  return (
    select jsonb_build_object('state', s.campaign, 'revision', s.revision, 'message', r.message)
    from community_private.hot_rod_receipt r
    join community_private.hot_rod_campaign s using (user_id)
    where r.user_id = p_member and r.operation = p_operation
  );
end;
$$;

revoke all on function public.community_hot_rod_read(uuid),
  public.community_hot_rod_commit(uuid,integer,uuid,jsonb,text,jsonb),
  public.community_hot_rod_receipt(uuid,uuid) from public, anon, authenticated;
grant execute on function public.community_hot_rod_read(uuid),
  public.community_hot_rod_commit(uuid,integer,uuid,jsonb,text,jsonb),
  public.community_hot_rod_receipt(uuid,uuid) to service_role;

create function community_private.hot_rod_duel_view(d community_private.hot_rod_duel, viewer uuid)
returns jsonb language sql stable set search_path = ''
as $$
  select jsonb_build_object(
    'id',d.id,'kind',d.kind,'challenger',d.challenger,'challenged',d.challenged,
    'status',case when d.status in ('pending','accepted') and d.expires_at <= now() then 'expired' else d.status end,
    'you',viewer,'opponent',case when d.challenger=viewer then d.challenged else d.challenger end,
    'started',mine.race_id is not null,'finished',mine.result is not null,
    'youResult',mine.result,'theirResult',theirs.result,'winner',d.winner,'isTie',d.is_tie,
    'expiresAt',d.expires_at
  )
  from (select viewer as user_id) u
  left join community_private.hot_rod_duel_run mine on mine.duel = d.id and mine.user_id = u.user_id
  left join community_private.hot_rod_duel_run theirs on theirs.duel = d.id and theirs.user_id <> u.user_id;
$$;
revoke all on function community_private.hot_rod_duel_view(community_private.hot_rod_duel,uuid)
  from public, anon, authenticated;

create function public.community_hot_rod_crew(p_member uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform community_private.hot_rod_approved(p_member);
  return jsonb_build_object(
    'members',coalesce((
      select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id',m.user_id,'name',m.display_name,
        'avatar_path',case when p.avatar_mode = 'photo' then p.avatar_path end,
        'avatar_icon',case when p.avatar_mode = 'icon' then p.avatar_icon end,
        'campaign',s.campaign
      )) order by m.display_name,m.user_id)
      from public.community_members m
      left join public.community_profiles p on p.user_id = m.user_id and p.account_active
        and (p.published or p.user_id = p_member)
      left join community_private.hot_rod_campaign s on s.user_id=m.user_id
      where m.status='approved'
    ),'[]'::jsonb),
    'challenges',coalesce((
      select jsonb_agg(community_private.hot_rod_duel_view(entry.duel,p_member) order by entry.created_at desc)
      from (
        select d as duel, d.created_at
        from community_private.hot_rod_duel d
        join public.community_members m on m.user_id = case when d.challenger=p_member then d.challenged else d.challenger end
          and m.status='approved'
        where p_member in (d.challenger,d.challenged)
          and (d.status in ('pending','accepted') and d.expires_at > now()
            or d.created_at > now() - interval '60 days')
        order by case when d.status in ('pending','accepted') and d.expires_at > now() then 0 else 1 end, d.created_at desc
        limit 48
      ) entry
    ),'[]'::jsonb)
  );
end;
$$;

create function public.community_hot_rod_duel_invite(p_member uuid, p_target uuid, p_kind text, p_seed bigint, p_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  d community_private.hot_rod_duel%rowtype;
begin
  perform community_private.hot_rod_approved(p_member);
  perform community_private.hot_rod_approved(p_target);
  if p_member=p_target or p_kind not in ('drag','road') or p_id is null then
    raise exception 'Choose a different family driver and a race type' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('hot-rod-duel:' || least(p_member,p_target)::text,0));
  perform pg_advisory_xact_lock(hashtextextended('hot-rod-duel:' || greatest(p_member,p_target)::text,0));
  select * into d from community_private.hot_rod_duel where id=p_id;
  if found then
    if d.challenger<>p_member or d.challenged<>p_target or d.kind<>p_kind then
      raise exception 'This challenge request is already in use' using errcode = '22023';
    end if;
    return community_private.hot_rod_duel_view(d,p_member);
  end if;
  select * into d from community_private.hot_rod_duel
    where ((challenger=p_member and challenged=p_target) or (challenged=p_member and challenger=p_target))
      and kind=p_kind and status in ('pending','accepted') and expires_at>now()
    limit 1;
  if found then return community_private.hot_rod_duel_view(d,p_member); end if;
  if (select count(*) from community_private.hot_rod_duel
    where (p_member in (challenger,challenged) or p_target in (challenger,challenged))
      and status in ('pending','accepted') and expires_at>now()) >= 16 then
    raise exception 'Finish some open challenges first' using errcode = '22023';
  end if;
  insert into community_private.hot_rod_duel(id,challenger,challenged,kind,seed)
    values(p_id,p_member,p_target,p_kind,p_seed) returning * into d;
  return community_private.hot_rod_duel_view(d,p_member);
end;
$$;

create function public.community_hot_rod_duel_respond(p_member uuid, p_id uuid, p_accept boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  d community_private.hot_rod_duel%rowtype;
  response text := case when p_accept then 'accepted' else 'declined' end;
begin
  perform community_private.hot_rod_approved(p_member);
  select * into d from community_private.hot_rod_duel where id=p_id and challenged=p_member for update;
  if not found then raise exception 'This invitation is unavailable' using errcode = '42501'; end if;
  perform community_private.hot_rod_approved(d.challenger);
  if d.status=response then return community_private.hot_rod_duel_view(d,p_member); end if;
  if d.status<>'pending' or d.expires_at<=now() then
    raise exception 'This invitation is no longer open' using errcode = '22023';
  end if;
  update community_private.hot_rod_duel set status=response where id=d.id returning * into d;
  return community_private.hot_rod_duel_view(d,p_member);
end;
$$;

create function public.community_hot_rod_duel_read(p_member uuid, p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  d community_private.hot_rod_duel%rowtype;
  run community_private.hot_rod_duel_run%rowtype;
begin
  perform community_private.hot_rod_approved(p_member);
  select * into d from community_private.hot_rod_duel where id=p_id and p_member in (challenger,challenged);
  if not found then raise exception 'This challenge is unavailable' using errcode = '42501'; end if;
  perform community_private.hot_rod_approved(case when d.challenger=p_member then d.challenged else d.challenger end);
  select * into run from community_private.hot_rod_duel_run where duel=d.id and user_id=p_member;
  return jsonb_build_object('challenge',community_private.hot_rod_duel_view(d,p_member),
    'seed',d.seed,'race',run.race,'result',run.result);
end;
$$;

create function public.community_hot_rod_duel_start(p_member uuid, p_id uuid, p_expected int, p_race jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  d community_private.hot_rod_duel%rowtype;
  run community_private.hot_rod_duel_run%rowtype;
begin
  perform community_private.hot_rod_approved(p_member);
  perform pg_advisory_xact_lock(hashtextextended('hot-rod:' || p_member::text,0));
  select * into d from community_private.hot_rod_duel where id=p_id and p_member in (challenger,challenged) for update;
  if not found then raise exception 'This challenge is unavailable' using errcode = '42501'; end if;
  perform community_private.hot_rod_approved(case when d.challenger=p_member then d.challenged else d.challenger end);
  if d.status<>'accepted' or d.expires_at<=now() then
    raise exception 'The other driver must accept an open challenge first' using errcode = '22023';
  end if;
  select * into run from community_private.hot_rod_duel_run where duel=d.id and user_id=p_member;
  if run.result is not null then raise exception 'Your run has already been submitted' using errcode = '22023'; end if;
  if run.race_id is not null then return run.race; end if;
  if (select revision from community_private.hot_rod_campaign where user_id=p_member) is distinct from p_expected then
    raise exception 'The garage changed on another screen' using errcode = '40001';
  end if;
  if p_race->>'kind' is distinct from d.kind or (p_race->>'seed')::bigint is distinct from d.seed
    or p_race->>'timeTrial' is distinct from 'true' then
    raise exception 'The race does not match this invitation' using errcode = '22023';
  end if;
  insert into community_private.hot_rod_duel_run(duel,user_id,race_id,race)
    values(d.id,p_member,(p_race->>'id')::uuid,p_race);
  return p_race;
end;
$$;

create function public.community_hot_rod_duel_finish(p_member uuid, p_id uuid, p_race_id uuid, p_result jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  d community_private.hot_rod_duel%rowtype;
  run community_private.hot_rod_duel_run%rowtype;
  rival community_private.hot_rod_duel_run%rowtype;
  winner_id uuid;
  mine_ms int;
  rival_ms int;
begin
  perform community_private.hot_rod_approved(p_member);
  select * into d from community_private.hot_rod_duel where id=p_id and p_member in (challenger,challenged) for update;
  if not found then raise exception 'This challenge is unavailable' using errcode = '42501'; end if;
  perform community_private.hot_rod_approved(case when d.challenger=p_member then d.challenged else d.challenger end);
  select * into run from community_private.hot_rod_duel_run where duel=d.id and user_id=p_member and race_id=p_race_id;
  if not found then raise exception 'This run was not started' using errcode = '22023'; end if;
  if run.result is not null then return community_private.hot_rod_duel_view(d,p_member); end if;
  if d.status<>'accepted' or d.expires_at<=now() then
    raise exception 'This challenge is no longer open' using errcode = '22023';
  end if;
  if p_result->>'outcome' is null or p_result->>'outcome' not in
    ('finish','loss','false_start','crash','engine','gearbox','fuel','abandoned') then
    raise exception 'Invalid race result' using errcode = '22023';
  end if;
  mine_ms := (p_result->>'ms')::int;
  if mine_ms is null or mine_ms<0 or mine_ms>280000 or (p_result->>'outcome'='finish' and mine_ms=0) then
    raise exception 'Invalid race time' using errcode = '22023';
  end if;
  update community_private.hot_rod_duel_run set result=jsonb_build_object(
    'outcome',p_result->>'outcome','ms',mine_ms,'reaction',(p_result->>'reaction')::int,
    'finished',p_result->>'outcome'='finish') where duel=d.id and user_id=p_member;
  select * into rival from community_private.hot_rod_duel_run where duel=d.id and user_id<>p_member;
  if rival.result is not null then
    if p_result->>'outcome'<>'finish' then mine_ms := null; end if;
    if rival.result->>'outcome'='finish' then rival_ms := (rival.result->>'ms')::int; end if;
    if mine_ms is not null and (rival_ms is null or mine_ms<rival_ms) then winner_id:=p_member;
    elsif rival_ms is not null and (mine_ms is null or rival_ms<mine_ms) then winner_id:=rival.user_id; end if;
    update community_private.hot_rod_duel set status='completed',winner=winner_id,
      is_tie=coalesce(mine_ms=rival_ms,false)
      where id=d.id returning * into d;
    update public.community_family_revisions set revision=revision+1,changed_at=clock_timestamp() where topic='scores';
  end if;
  return community_private.hot_rod_duel_view(d,p_member);
end;
$$;

revoke all on function public.community_hot_rod_crew(uuid),
  public.community_hot_rod_duel_invite(uuid,uuid,text,bigint,uuid), public.community_hot_rod_duel_respond(uuid,uuid,boolean),
  public.community_hot_rod_duel_read(uuid,uuid), public.community_hot_rod_duel_start(uuid,uuid,int,jsonb),
  public.community_hot_rod_duel_finish(uuid,uuid,uuid,jsonb)
  from public,anon,authenticated;
grant execute on function public.community_hot_rod_crew(uuid),
  public.community_hot_rod_duel_invite(uuid,uuid,text,bigint,uuid), public.community_hot_rod_duel_respond(uuid,uuid,boolean),
  public.community_hot_rod_duel_read(uuid,uuid), public.community_hot_rod_duel_start(uuid,uuid,int,jsonb),
  public.community_hot_rod_duel_finish(uuid,uuid,uuid,jsonb)
  to service_role;

create function public.community_hot_rod_standings()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  answer jsonb;
begin
  perform community_private.hot_rod_approved(viewer);
  with classic as (
    select h.user_id, sum(h.points) as points, count(*) filter (where h.champion) as crowns,
      count(*) filter (where h.won and h.rival <> 'mystery') as wins,
      count(*) filter (where not h.won and h.rival <> 'mystery') as losses,
      count(*) filter (where h.won and h.kind = 'drag') as drag_wins,
      count(*) filter (where h.won and h.kind = 'road' and h.rival <> 'mystery') as road_wins,
      min(h.hours) filter (where h.champion) as best_hours,
      count(*) filter(where h.rival='mystery' and h.won) as mystery_wins,
      max(case when h.rival='mystery' and h.won then 5 when h.champion then 4 when h.won and h.rival in ('cal','eddie') then 3
        when h.won and h.kind = 'road' then 2 when h.won then 1 else 0 end) as progress
    from community_private.hot_rod_result h
    join public.community_members m on m.user_id = h.user_id and m.status = 'approved'
    group by h.user_id
  ), duels as (
    select m.user_id, count(*) as duels, count(*) filter(where d.winner=m.user_id) as duel_wins,
      count(*) filter(where d.is_tie) as duel_draws
    from community_private.hot_rod_duel d
    join public.community_members m on m.user_id in (d.challenger,d.challenged) and m.status='approved'
    where d.status='completed'
    group by m.user_id
  ), tally as (
    select coalesce(c.user_id,d.user_id) as user_id, coalesce(c.points,0)+20*coalesce(d.duel_wins,0) as points,
      coalesce(c.crowns,0) as crowns, coalesce(c.wins,0) as wins, coalesce(c.losses,0) as losses,
      coalesce(c.drag_wins,0) as drag_wins, coalesce(c.road_wins,0) as road_wins, c.best_hours,
      coalesce(c.progress,0) as progress, coalesce(c.mystery_wins,0) as mystery_wins,
      coalesce(d.duels,0) as duels, coalesce(d.duel_wins,0) as duel_wins, coalesce(d.duel_draws,0) as duel_draws
    from classic c full join duels d using(user_id)
  ), ranking as (
    select t.*, dense_rank() over(order by mystery_wins desc,crowns desc,points desc,best_hours asc nulls last,wins desc) as rank
    from tally t
  )
  select jsonb_build_object(
    'players',count(*),'achievements',coalesce(sum(r.crowns+r.mystery_wins+(r.drag_wins>0)::int
      +(r.road_wins>0)::int+(r.duel_wins>0)::int),0),
    'entries',coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'rank',r.rank,'score',r.points,'name',m.display_name,'mine',r.user_id = viewer,
      'crowns',r.crowns,'wins',r.wins,'losses',r.losses,'drag_wins',r.drag_wins,'road_wins',r.road_wins,
      'best_hours',r.best_hours,'progress',r.progress,
      'mystery_wins',r.mystery_wins,'duels',r.duels,'duel_wins',r.duel_wins,'duel_draws',r.duel_draws,
      'achievements',r.crowns+r.mystery_wins+(r.drag_wins>0)::int+(r.road_wins>0)::int+(r.duel_wins>0)::int,
      'avatar_member',r.user_id,
      'avatar_path',case when p.avatar_mode = 'photo' then p.avatar_path end,
      'avatar_icon',case when p.avatar_mode = 'icon' then p.avatar_icon end
    )) order by r.rank,m.display_name,r.user_id),'[]'::jsonb)
  ) into answer
  from ranking r
  join public.community_members m on m.user_id = r.user_id
  left join public.community_profiles p on p.user_id = r.user_id and p.account_active
    and (p.published or p.user_id = viewer);
  return answer;
end;
$$;
revoke all on function public.community_hot_rod_standings() from public, anon, authenticated;
grant execute on function public.community_hot_rod_standings() to authenticated;

commit;
