-- Deterministic replay for the existing members-only Family Arcade.
-- Score commits require the Edge Function's service role. Existing rows,
-- earned badges, levels, and already-open legacy runs retain their meaning.
begin;

alter table public.community_boardride_runs
  add column physics_version smallint not null default 1 check(physics_version in (1,2)),
  add column share_replay boolean not null default false,
  add column replay_frames jsonb;
alter table public.community_dash_runs
  add column physics_version smallint not null default 1 check(physics_version in (1,2)),
  add column physics_rules jsonb;
alter table public.community_dash_levels
  add column physics_version smallint not null default 1 check(physics_version in (1,2)),
  add column layout jsonb not null default '[]'::jsonb check(jsonb_typeof(layout)='array');
alter table public.community_boardride_badges drop constraint community_boardride_badges_badge_check;
alter table public.community_boardride_badges add constraint community_boardride_badges_badge_check
  check(badge in ('first','five','ten','fifteen','twenty','finish','boost-master','ball-survivor'));
alter table public.community_dash_levels drop constraint community_dash_levels_pattern_check;
alter table public.community_dash_levels add constraint community_dash_levels_pattern_check
  check(length(pattern) between 24 and 90 and pattern ~ '^[.sbglwcpfrmodhCSBUWRPVIFLEJOMKDT]+$');
create index community_boardride_shared_ghosts on public.community_boardride_runs(stage,seed,elapsed_ms)
  where physics_version=2 and status='finished' and share_replay;

create or replace function public.community_boardride_finish(p_run_id uuid,p_elapsed_ms integer,p_coins integer)
returns jsonb language plpgsql volatile security definer set search_path='' as $fn$
declare v_user uuid;v_run public.community_boardride_runs%rowtype;v_profile public.community_boardride_profiles%rowtype;
 v_wall integer;v_points integer;v_new text[]:=array[]::text[];v_badge text;v_milestone record;v_next integer;
begin
 v_user:=public.community_boardride_allowed();
 if p_elapsed_ms is null or p_elapsed_ms not between 7000 and 300000 or
  p_coins is null or p_coins not between 0 and 80 then
   raise exception 'Invalid race duration or star count' using errcode='22023';
 end if;
 select * into v_run from public.community_boardride_runs
  where id=p_run_id and user_id=v_user and status='active' and physics_version=1 for update;
 if not found then raise exception 'Race already completed or not owned by this member' using errcode='42501';end if;
 v_wall:=floor(extract(epoch from(now()-v_run.started_at))*1000)::integer;
 if v_wall<6500 or p_elapsed_ms>v_wall+2500 or v_wall>1200000 then
  raise exception 'Race timing could not be validated' using errcode='22023';
 end if;
 select * into v_profile from public.community_boardride_profiles where user_id=v_user for update;
 if v_profile.stage<>v_run.stage then raise exception 'Stage progression changed during the race' using errcode='22023';end if;
 v_points:=100+v_run.stage*20+greatest(0,500-p_elapsed_ms/150)+p_coins*20;
 update public.community_boardride_runs set status='finished',finished_at=now(),
  elapsed_ms=p_elapsed_ms,coins=p_coins,points=v_points where id=v_run.id;
 v_next:=least(31,v_run.stage+1);
 update public.community_boardride_profiles set stage=v_next,runs=runs+1,clears=clears+1,
  points=points+v_points,coins=coins+p_coins,
  best_ms=least(coalesce(best_ms,300000),p_elapsed_ms),updated_at=now()
  where user_id=v_user;
 for v_milestone in select * from (values
   ('first',2),('five',6),('ten',11),('fifteen',16),('twenty',21),('finish',31)
  ) as m(badge,required) loop
  if v_next>=v_milestone.required then
   insert into public.community_boardride_badges(user_id,badge) values(v_user,v_milestone.badge)
    on conflict(user_id,badge) do nothing;
   if found then v_new:=array_append(v_new,v_milestone.badge);end if;
  end if;
 end loop;
 return jsonb_build_object('stage',v_run.stage,'next_stage',v_next,'points',v_points,
  'coins',p_coins,'new_badges',to_jsonb(v_new),'saved',true);
end;
$fn$;

create function public.community_boardride_start_v2(p_board text,p_share boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_data jsonb;v_owner uuid;v_id uuid;v_stage integer;v_seed integer;v_ghost jsonb;
begin
  v_owner:=public.community_boardride_allowed();
  if (select count(*) from public.community_boardride_runs where user_id=v_owner
        and started_at>now()-interval '60 seconds')>=14 then
    raise exception 'Wait a moment before starting another race' using errcode='22023';
  end if;
  -- Reuse the current stage and board unlock gates.
  v_data:=public.community_boardride_start(p_board);
  v_id:=(v_data->>'run_id')::uuid;
  v_stage:=(v_data->>'stage')::integer;
  v_seed:=(v_stage*212561)#196930;
  update public.community_boardride_runs
  set seed=v_seed,physics_version=2,share_replay=coalesce(p_share,false) where id=v_id;
  select jsonb_build_object('name',coalesce(nullif(m.display_name,''),'Family member'),
    'frames',r.replay_frames,'time_ms',r.elapsed_ms,'board',r.board)
  into v_ghost from public.community_boardride_runs r
  join public.community_members m on m.user_id=r.user_id and m.status='approved'
  where r.stage=v_stage and r.seed=v_seed and r.physics_version=2 and r.share_replay
    and r.status='finished' and r.user_id<>v_owner and r.replay_frames is not null
  order by r.elapsed_ms,r.finished_at limit 1;
  return v_data||jsonb_build_object('seed',v_seed,'ghost',v_ghost);
end;
$$;

create function public.community_boardride_unshare_replays()
returns void language plpgsql security definer set search_path='' as $$
declare v_owner uuid:=public.community_boardride_allowed();
begin
  update public.community_boardride_runs set share_replay=false,replay_frames=null
  where user_id=v_owner and share_replay;
end;
$$;

create function public.community_boardride_commit_v2(p_owner uuid,p_id uuid,p_result jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_run public.community_boardride_runs%rowtype;v_stage integer;
  v_ms integer:=(p_result->>'elapsed_ms')::int;v_coins integer:=(p_result->>'coins')::int;
  v_wall integer;v_points integer;v_next integer;v_new jsonb;
begin
  if not exists(select 1 from public.community_members where user_id=p_owner and status='approved') then
    raise exception 'Approved Family Message Board membership required' using errcode='42501';
  end if;
  select * into v_run from public.community_boardride_runs
  where id=p_id and user_id=p_owner and status='active' and physics_version=2;
  if not found then raise exception 'Race is missing or already finished' using errcode='22023';end if;
  select stage into v_stage from public.community_boardride_profiles where user_id=p_owner for update;
  select * into v_run from public.community_boardride_runs
  where id=p_id and user_id=p_owner and status='active' and physics_version=2 for update;
  if not found or v_stage<>v_run.stage then
    raise exception 'Race is missing or the stage changed' using errcode='22023';
  end if;
  if p_result->>'won' is distinct from 'true' or v_ms is null or v_ms not between 2500 and 150000
    or v_coins is null or v_coins not between 0 and 20 then
    raise exception 'Finish the actual course to earn a stage clear' using errcode='22023';
  end if;
  v_wall:=floor(extract(epoch from clock_timestamp()-v_run.started_at)*1000)::integer;
  if v_wall<v_ms-600 or v_wall>1200000 then
    raise exception 'Race timing could not be validated' using errcode='22023';
  end if;
  v_points:=100+v_stage*20+greatest(0,500-v_ms/150)+v_coins*20;
  v_next:=least(31,v_stage+1);
  update public.community_boardride_runs set status='finished',finished_at=clock_timestamp(),
    elapsed_ms=v_ms,coins=v_coins,points=v_points,
    replay_frames=case when v_run.share_replay then p_result->'frames' else null end where id=p_id;
  update public.community_boardride_profiles set stage=v_next,runs=runs+1,clears=clears+1,
    points=points+v_points,coins=coins+v_coins,best_ms=least(coalesce(best_ms,300000),v_ms),
    updated_at=now() where user_id=p_owner;
  with awarded as (
    insert into public.community_boardride_badges(user_id,badge)
    select p_owner, milestone.badge from (values
      ('first',v_next>=2),('five',v_next>=6),('ten',v_next>=11),('fifteen',v_next>=16),
      ('twenty',v_next>=21),('finish',v_next>=31),
      ('boost-master',coalesce((p_result->>'boost_clears')::int,0)>0),
      ('ball-survivor',coalesce((p_result->>'ball_hits')::int,0)>0)
    ) as milestone(badge,earned) where milestone.earned
    on conflict(user_id,badge) do nothing returning badge
  ) select coalesce(jsonb_agg(badge),'[]'::jsonb) into v_new from awarded;
  return jsonb_build_object('stage',v_stage,'next_stage',v_next,'points',v_points,'coins',v_coins,
    'elapsed_ms',v_ms,'new_badges',v_new,'saved',true);
end;
$$;

create or replace function public.community_dash_save(p_title text,p_pattern text,p_difficulty int,p_level_id bigint default null)
returns jsonb language plpgsql security definer
set search_path to pg_catalog,public
as $$
declare v_id bigint;v_owner uuid:=auth.uid();
begin
 if not public.community_dash_allowed() then raise exception 'Approved Commons membership required' using errcode='42501';end if;
 p_title:=btrim(coalesce(p_title,''));
 if length(p_title) not between 3 and 58 or p_title !~ '^[A-Za-z0-9 ]{3,58}$'
    or p_difficulty not between 1 and 6 or p_pattern is null
    or length(p_pattern) not between 24 and 90 or p_pattern !~ '^[.sbglwcpfrmodhCSBUWRPVIFLEJOMKDT]+$'
    or p_difficulty is null
    or left(p_pattern,4)<>'....' or right(p_pattern,4)<>'....' then
   raise exception 'Use a 3–58 character title, safe ends, and 24–90 tiles' using errcode='22023';
 end if;
 if p_level_id is null then
  if (select count(*) from public.community_dash_levels where creator=v_owner)>=12 then
   raise exception 'Maximum of twelve authored levels' using errcode='22023';end if;
  insert into public.community_dash_levels(kind,title,creator,difficulty,pattern)
  values('member',p_title,v_owner,p_difficulty,p_pattern) returning id into v_id;
 else
  update public.community_dash_levels set title=p_title,pattern=p_pattern,
   difficulty=p_difficulty,layout='[]'::jsonb,revision=revision+1,updated_at=now()
   where id=p_level_id and creator=v_owner and kind='member' and not published
  returning id into v_id;
  if v_id is null then raise exception 'Only your unpublished draft can be edited' using errcode='42501';end if;
 end if;
 return jsonb_build_object('id',v_id,'status','draft','playtest_required',true);
end $$;

create function public.community_dash_save_layout(
  p_title text,p_pattern text,p_difficulty integer,p_level_id bigint,p_world text,p_boss_style text,p_layout jsonb
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_data jsonb;v_item jsonb;v_tile integer;v_previous integer:=-1;
begin
  if not public.community_dash_allowed() then raise exception 'Approved family membership required' using errcode='42501';end if;
  if jsonb_typeof(p_layout) is distinct from 'array' then
    raise exception 'Invalid track layout' using errcode='22023';
  end if;
  if jsonb_array_length(p_layout)>90 then raise exception 'Too many tile transforms' using errcode='22023';end if;
  for v_item in select value from jsonb_array_elements(p_layout) loop
    if v_item::text !~ '^\[[0-9]{1,2}, [0-3], [1-3], [01], [0-2]\]$' then
      raise exception 'Invalid tile transform' using errcode='22023';
    end if;
    v_tile:=(v_item->>0)::integer;
    if v_tile<=v_previous or v_tile<4 or v_tile>=length(p_pattern)-4 or
      (substring(p_pattern from v_tile+1 for 1) !~ '^[sblwcpfrmodhDMO]$'
         and (v_item->>1<>'0' or v_item->>2<>'2' or v_item->>3<>'0'))
      or (v_item->>3<>'0' and substring(p_pattern from v_tile+1 for 1) !~ '^[scf]$') then
      raise exception 'This tile cannot use that transform' using errcode='22023';
    end if;
    v_previous:=v_tile;
  end loop;
  v_data:=public.community_dash_save_world(p_title,p_pattern,p_difficulty,p_level_id,p_world,p_boss_style);
  update public.community_dash_levels set layout=p_layout,physics_version=2
    where id=(v_data->>'id')::bigint and creator=auth.uid() and not published;
  return v_data;
end;
$$;

create or replace function public.community_dash_state()
returns jsonb language plpgsql volatile security definer
set search_path to pg_catalog,public
as $$
declare v_owner uuid:=auth.uid();v_levels jsonb;v_progress jsonb;
 v_awards jsonb;v_leaders jsonb;v_mine jsonb;v_active jsonb;
 v_last int;v_current int;v_from int;v_to int;v_stage int;
begin
 if not public.community_dash_allowed() then raise exception 'Approved family membership required' using errcode='42501';end if;
 select coalesce(max(l.stage),0) into v_last from public.community_dash_progress pr
  join public.community_dash_levels l on l.id=pr.level_id and l.kind='campaign'
  where pr.user_id=v_owner and pr.clears>0;
 v_current:=least(1000000000,v_last+1);
 v_from:=greatest(1,v_current-3);v_to:=least(1000000000,v_current+9);
 for v_stage in v_from..v_to loop
  perform public.community_dash_ensure_stage(v_stage);
 end loop;
 select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'title',v.title,
  'kind',v.kind,'stage',v.stage,'difficulty',v.difficulty,'pattern',v.pattern,
  'creator',v.creator,'creator_name',coalesce(m.display_name,'The Family'),
  'published',v.published,'verified_solves',coalesce(s.solved,0),
  'world',v.world,'pace_ms',v.pace_ms,'boss',v.boss,
  'boss_style',v.boss_style,'boss_name',v.boss_name,'layout',v.layout,
  'designer_award',coalesce(a.badge,''),'designer_solve_ms',a.solve_ms)
  order by v.kind,v.stage nulls last,v.created_at desc),'[]'::jsonb)
 into v_levels from public.community_dash_levels v
 left join public.community_members m on m.user_id=v.creator and m.status='approved'
 left join lateral (select count(distinct user_id) solved from public.community_dash_progress
                 where level_id=v.id and user_id<>coalesce(v.creator,'00000000-0000-0000-0000-000000000000'::uuid)) s on true
 left join public.community_dash_awards a on a.level_id=v.id and a.award_type='designer'
 where (v.kind='campaign' and v.stage between v_from and v_to)
    or (v.kind='member' and (v.published or v.creator=v_owner));
 select coalesce(jsonb_agg(jsonb_build_object('level_id',pr.level_id,
  'clears',pr.clears,'best_ms',pr.best_ms)),'[]'::jsonb)
 into v_progress from public.community_dash_progress pr
 join public.community_dash_levels l on l.id=pr.level_id
 where pr.user_id=v_owner and
  (l.kind='member' or (l.kind='campaign' and l.stage between greatest(1,v_current-4) and v_to));
 select coalesce(jsonb_agg(jsonb_build_object('level_id',t.level_id,'type',t.award_type,
   'badge',t.badge,'points',t.points,'solve_ms',t.solve_ms,'earned_at',t.earned_at)
   order by t.earned_at desc),'[]'::jsonb)
 into v_awards from (
 select level_id,award_type,badge,points,solve_ms,earned_at
 from public.community_dash_awards where user_id=v_owner order by earned_at desc limit 90) t;
 select coalesce(jsonb_agg(jsonb_build_object('user_id',p.user_id,'name',m.display_name,
  'player_points',p.player_points,'designer_points',p.designer_points,
  'clears',p.clears,'published',p.published_levels)
  order by p.player_points desc,p.designer_points desc,m.display_name),'[]'::jsonb)
 into v_leaders from public.community_dash_profiles p
 join public.community_members m on m.user_id=p.user_id and m.status='approved';
 select jsonb_build_object('player_points',coalesce(player_points,0),
  'designer_points',coalesce(designer_points,0),'clears',coalesce(clears,0),
  'published',coalesce(published_levels,0)) into v_mine
 from public.community_dash_profiles where user_id=v_owner;
 select jsonb_build_object('id',id,'level_id',level_id,'started_at',started_at)
 into v_active from public.community_dash_runs where user_id=v_owner and status='active' limit 1;
 return jsonb_build_object('levels',v_levels,'progress',v_progress,
  'awards',v_awards,'leaders',v_leaders,'mine',coalesce(v_mine,'{"player_points":0,"designer_points":0,"clears":0,"published":0}'::jsonb),
  'active',v_active,'user_id',v_owner,'pace_ms',210,'campaign_current',v_current,
  'campaign_max',1000000000,'campaign_window_from',v_from,'campaign_window_to',v_to);
end $$;

create or replace function public.community_dash_open_run(p_level_id bigint,p_modern boolean)
returns jsonb language plpgsql security definer
set search_path to pg_catalog,public
as $$
declare v public.community_dash_levels%rowtype;r public.community_dash_runs%rowtype;
 v_owner uuid:=auth.uid();v_previous bigint;v_rules jsonb;
begin
 if not public.community_dash_allowed() then raise exception 'Approved Commons membership required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_owner::text||':dash-forge',0));
 select * into v from public.community_dash_levels where id=p_level_id and
    (published or (kind='member' and creator=v_owner)) for share;
 if not found then raise exception 'Level unavailable' using errcode='42501';end if;
 if not p_modern and (v.physics_version=2 or v.pattern~'[A-Z]') then
  raise exception 'Refresh the board to play this updated course' using errcode='22023';end if;
 if v.kind='campaign' and v.stage>1 then
  select id into v_previous from public.community_dash_levels where kind='campaign' and stage=v.stage-1;
  if not exists(select 1 from public.community_dash_progress
        where user_id=v_owner and level_id=v_previous) then
   raise exception 'Finish the previous campaign stage to unlock this level' using errcode='22023';end if;
 end if;
 if (select count(*) from public.community_dash_runs where user_id=v_owner
       and started_at>now()-interval '60 seconds')>=14 then
   raise exception 'Wait a moment before starting another run' using errcode='22023';end if;
 update public.community_dash_runs set status='abandoned',finished_at=now() where user_id=v_owner and status='active';
 insert into public.community_dash_profiles(user_id) values(v_owner) on conflict do nothing;
 v_rules:=jsonb_build_object('pace',v.pace_ms,'boss',v.boss,'boss_style',v.boss_style,'layout',v.layout,'stage',v.stage);
 insert into public.community_dash_runs(user_id,level_id,pattern_snapshot,level_revision,physics_version,physics_rules)
 values(v_owner,v.id,v.pattern,v.revision,case when p_modern then 2 else 1 end,
   case when p_modern then v_rules else null end) returning * into r;
 return jsonb_build_object('run_id',r.id,'level_id',v.id,'title',v.title,
   'pattern',v.pattern,'pace_ms',v.pace_ms,'world',v.world,'boss',v.boss,
   'boss_style',v.boss_style,'boss_name',v.boss_name,'layout',v.layout,'start_at',r.started_at);
end $$;

create or replace function public.community_dash_start(p_level_id bigint)
returns jsonb language sql security definer set search_path='' as $$
  select public.community_dash_open_run(p_level_id,false);
$$;
create function public.community_dash_start_v2(p_level_id bigint)
returns jsonb language sql security definer set search_path='' as $$
  select public.community_dash_open_run(p_level_id,true);
$$;

create function public.community_arcade_replay_input(p_owner uuid,p_game text,p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_result jsonb;
begin
  if not exists(select 1 from public.community_members where user_id=p_owner and status='approved') then
    raise exception 'Approved Family Message Board membership required' using errcode='42501';
  end if;
  if p_game='skyboard' then
    select jsonb_build_object('stage',stage,'seed',seed,'board',board,'sample',share_replay) into v_result
    from public.community_boardride_runs where id=p_id and user_id=p_owner and status='active'
      and physics_version=2 and started_at>now()-interval '20 minutes';
  elsif p_game='dash' then
    select jsonb_build_object('pattern',pattern_snapshot,'rules',physics_rules) into v_result
    from public.community_dash_runs where id=p_id and user_id=p_owner and status='active'
      and physics_version=2 and started_at>now()-interval '3 minutes';
  end if;
  if v_result is null then raise exception 'Start a fresh run to verify your result' using errcode='22023';end if;
  return v_result;
end;
$$;

create or replace function public.community_dash_commit(p_owner uuid,p_run_id uuid,p_jumps jsonb,p_verified jsonb)
returns jsonb language plpgsql security definer
set search_path to pg_catalog,public
as $$
declare v public.community_dash_runs%rowtype;v_level public.community_dash_levels%rowtype;
 v_owner uuid:=p_owner;v_sim jsonb;v_won boolean;v_dead int;v_elapsed int;v_expected int;
 v_points int;v_new int;v_designer_ms int;v_designer_points int;v_badge text;
begin
 if not exists(select 1 from public.community_members where user_id=v_owner and status='approved') then
  raise exception 'Approved family membership required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_owner::text||':dash-forge',0));
 select * into v from public.community_dash_runs where id=p_run_id and user_id=v_owner for update;
 if not found or v.status<>'active' then raise exception 'Run is missing or already finished' using errcode='22023';end if;
 if (v.physics_version=2) is distinct from (p_verified is not null) then
  raise exception 'This run requires its matching replay verifier' using errcode='22023';end if;
 select * into v_level from public.community_dash_levels where id=v.level_id for update;
 if v.physics_version=2 then v_sim:=p_verified;
 else v_sim:=public.community_dash_replay(v.pattern_snapshot,p_jumps);end if;
 v_won:=(v_sim->>'won')::boolean;v_dead:=(v_sim->>'death_tile')::int;
 v_expected:=case when v.physics_version=2 then (v_sim->>'elapsed_ms')::int
  else (v_sim->>'tiles')::int*v_level.pace_ms end;
 if v_expected is null or v_expected not between 1 and 150000 or v_won is null then
   raise exception 'Invalid verified simulation result' using errcode='22023';end if;
 v_elapsed:=floor(extract(epoch from clock_timestamp()-v.started_at)*1000)::int;
 if v_elapsed<greatest(0,v_expected-600) then
   raise exception 'Run finished faster than the validated tile clock' using errcode='22023';end if;
 if v_elapsed>v_expected+45000 then
   update public.community_dash_runs set status='abandoned',finished_at=now() where id=v.id;
   raise exception 'Run timed out. Start again.' using errcode='22023';end if;
 if v.physics_version=2 then v_elapsed:=v_expected;end if;
 update public.community_dash_runs set status=case when v_won then 'won' else 'dead' end,
  finished_at=clock_timestamp(),elapsed_ms=v_elapsed,death_tile=v_dead,jumps=p_jumps where id=v.id;
 if v_won then
  insert into public.community_dash_progress(user_id,level_id,clears,best_ms)
  values(v_owner,v.level_id,1,v_elapsed)
  on conflict(user_id,level_id) do update
  set clears=public.community_dash_progress.clears+1,
      best_ms=least(public.community_dash_progress.best_ms,excluded.best_ms);
  if v_level.published and (v_level.creator is null or v_level.creator<>v_owner) then
   v_points:=case when v_level.kind='campaign' then 100+least(300,v_level.stage)*40 else 125 end;
   v_badge:=case when v_level.kind='campaign' and v_level.stage%25=0 then 'WORLD TRIAL '||v_level.stage
     when v_level.kind='campaign' and v_level.stage=6 then 'ORIGIN CROWN'
     when v_level.kind='campaign' then 'CAMPAIGN STAGE '||v_level.stage else 'COMMUNITY CONQUEROR' end;
   insert into public.community_dash_awards(user_id,level_id,award_type,badge,points,solve_ms)
   values(v_owner,v.level_id,'player',v_badge,v_points,v_elapsed)
   on conflict do nothing;
   get diagnostics v_new = row_count;
   if v_new=1 then
    insert into public.community_dash_profiles(user_id,player_points,clears)
    values(v_owner,v_points,1) on conflict(user_id) do update
    set player_points=public.community_dash_profiles.player_points+v_points,
        clears=public.community_dash_profiles.clears+1,updated_at=now();
   end if;
  end if;
  if v_level.kind='member' and v_level.published and v_level.creator<>v_owner
     and v_level.creator is not null then
    -- First distinct solver's active, server-timed attempt history. Only a
    -- genuine validated win pays the builder; no likes, uploads or visits.
    select coalesce(sum(case when t.physics_version=2 then t.elapsed_ms else least(t.elapsed_ms,(case when t.status='won' then
        length(t.pattern_snapshot) else coalesce(t.death_tile+1,1) end)*v_level.pace_ms+1500) end),0)
      into v_designer_ms from (
       select elapsed_ms,status,pattern_snapshot,death_tile,physics_version from public.community_dash_runs
       where user_id=v_owner and level_id=v_level.id and status in('dead','won')
       and pattern_snapshot=v_level.pattern and level_revision=v_level.revision
       order by finished_at desc limit 12
      ) t;
    v_designer_points:=case when v_designer_ms>=90000 then 400
      when v_designer_ms>=45000 then 260
      when v_designer_ms>=25000 then 160 else 75 end;
    v_badge:=case when v_designer_points=400 then 'TIME ARCHITECT'
      when v_designer_points=260 then 'ENDURANCE ENGINEER'
      when v_designer_points=160 then 'PUZZLE BUILDER' else 'FIRST SOLVED' end;
    insert into public.community_dash_awards(user_id,level_id,award_type,badge,points,solve_ms)
    values(v_level.creator,v_level.id,'designer',v_badge,v_designer_points,v_designer_ms)
    on conflict do nothing;
    get diagnostics v_new=row_count;
    if v_new=1 then
     insert into public.community_dash_profiles(user_id,designer_points)
     values(v_level.creator,v_designer_points)
     on conflict(user_id) do update
       set designer_points=public.community_dash_profiles.designer_points+v_designer_points,updated_at=now();
    end if;
  end if;
 end if;
 return jsonb_build_object('won',v_won,'death_tile',v_dead,'elapsed_ms',v_elapsed,
   'server_verified',true,'level_id',v.level_id,'awarded',v_won and v_level.published);
end $$;

create or replace function public.community_dash_finish(p_run_id uuid,p_jumps jsonb)
returns jsonb language sql security definer set search_path='' as $$
  select public.community_dash_commit(auth.uid(),p_run_id,p_jumps,null);
$$;
create function public.community_dash_commit_v2(p_owner uuid,p_id uuid,p_trace jsonb,p_result jsonb)
returns jsonb language sql security definer set search_path='' as $$
  select public.community_dash_commit(p_owner,p_id,p_trace,p_result);
$$;

revoke all on function public.community_boardride_start_v2(text,boolean),
  public.community_boardride_unshare_replays(),
  public.community_dash_start_v2(bigint),
  public.community_dash_save_layout(text,text,integer,bigint,text,text,jsonb)
  from public,anon,authenticated;
grant execute on function public.community_boardride_start_v2(text,boolean),
  public.community_boardride_unshare_replays(),
  public.community_dash_start_v2(bigint),
  public.community_dash_save_layout(text,text,integer,bigint,text,text,jsonb) to authenticated;
revoke all on function public.community_dash_open_run(bigint,boolean),
  public.community_dash_commit(uuid,uuid,jsonb,jsonb),
  public.community_arcade_replay_input(uuid,text,uuid),
  public.community_boardride_commit_v2(uuid,uuid,jsonb),
  public.community_dash_commit_v2(uuid,uuid,jsonb,jsonb)
  from public,anon,authenticated;
grant execute on function public.community_arcade_replay_input(uuid,text,uuid),
  public.community_boardride_commit_v2(uuid,uuid,jsonb),
  public.community_dash_commit_v2(uuid,uuid,jsonb,jsonb) to service_role;

commit;
