
-- Family Message Board / Dash Forge. Tables deny all direct Data API access.
-- All member actions are authenticated RPCs checked against approved Commons membership.
create table if not exists public.community_dash_levels(
 id bigint generated always as identity primary key,
 kind text not null check(kind in ('campaign','member')),
 stage int,
 title text not null check(length(title) between 3 and 58),
 difficulty int not null check(difficulty between 1 and 6),
 pattern text not null check(length(pattern) between 24 and 90 and pattern ~ '^[.sbg]+$'),
 creator uuid references auth.users(id) on delete set null,
 published boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint community_dash_kind check((kind='campaign' and creator is null and stage between 1 and 6) or (kind='member' and creator is not null and stage is null)),
 constraint community_dash_endzones check(left(pattern,4)='....' and right(pattern,4)='....'),
 unique(kind,stage)
);
create index if not exists community_dash_levels_published on public.community_dash_levels(kind,published,created_at desc);
create table if not exists public.community_dash_runs(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 level_id bigint not null references public.community_dash_levels(id) on delete cascade,
 pattern_snapshot text not null,
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 status text not null default 'active' check(status in ('active','dead','won','abandoned')),
 elapsed_ms int,
 death_tile int,
 jumps jsonb not null default '[]'::jsonb
);
create unique index if not exists community_dash_one_active on public.community_dash_runs(user_id) where status='active';
create index if not exists community_dash_run_ledger on public.community_dash_runs(level_id,user_id,finished_at desc);
create table if not exists public.community_dash_progress(
 user_id uuid not null references auth.users(id) on delete cascade,
 level_id bigint not null references public.community_dash_levels(id) on delete cascade,
 clears int not null default 0 check(clears>=0),
 best_ms int not null check(best_ms>=0),
 first_clear_at timestamptz not null default now(),
 primary key(user_id,level_id)
);
create table if not exists public.community_dash_profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 player_points int not null default 0 check(player_points>=0),
 designer_points int not null default 0 check(designer_points>=0),
 published_levels int not null default 0 check(published_levels>=0),
 clears int not null default 0 check(clears>=0),
 updated_at timestamptz not null default now()
);
create table if not exists public.community_dash_awards(
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 level_id bigint not null references public.community_dash_levels(id) on delete cascade,
 award_type text not null check(award_type in ('player','designer')),
 badge text not null,
 points int not null check(points>0),
 solve_ms int,
 earned_at timestamptz not null default now(),
 unique(user_id,level_id,award_type)
);
alter table public.community_dash_levels enable row level security;
alter table public.community_dash_runs enable row level security;
alter table public.community_dash_progress enable row level security;
alter table public.community_dash_profiles enable row level security;
alter table public.community_dash_awards enable row level security;
revoke all on table public.community_dash_levels,public.community_dash_runs,public.community_dash_progress,public.community_dash_profiles,public.community_dash_awards from PUBLIC,anon,authenticated;
revoke all on sequence public.community_dash_levels_id_seq,public.community_dash_awards_id_seq from PUBLIC,anon,authenticated;

insert into public.community_dash_levels(kind,stage,title,difficulty,pattern,published) values
 ('campaign',1,'First Flight',1,'.......s......b.......g......s....',true),
 ('campaign',2,'Prism Parade',2,'......s.....b.......g......s.......b.......',true),
 ('campaign',3,'Neon Labyrinth',3,'........s.....b....g......s......b.....g......s.....',true),
 ('campaign',4,'Lightning Alley',4,'......s......b......g......s......b......g.......s........',true),
 ('campaign',5,'Crystal Pulse',5,'.......s.....b......g.....s.....b......g......s......b......g....',true),
 ('campaign',6,'The Last Leap',6,'......s......b.....g.....s......b......g......s......b......g.......s......',true)
on conflict(kind,stage) do nothing;

create or replace function public.community_dash_allowed()
returns boolean language sql stable security definer
set search_path to pg_catalog,public
as $$
 select auth.uid() is not null and exists (select 1 from public.community_members m where m.user_id=auth.uid() and m.status='approved');
$$;

-- Pure deterministic validator. The client may render the jump animations;
-- it cannot choose success, points, death position, or elapsed server time.
create or replace function public.community_dash_replay(p_pattern text,p_jumps jsonb)
returns jsonb language plpgsql immutable
set search_path to pg_catalog,public
as $$
declare v_last int := -5; v_jump int; v_i int; v_death int := null;
  v_list integer[] := '{}'::integer[]; v_s text;
begin
 if p_pattern is null or length(p_pattern) not between 24 and 90 or p_pattern !~ '^[.sbg]+$'
    or jsonb_typeof(p_jumps) is distinct from 'array'
    or jsonb_array_length(p_jumps)>ceil(length(p_pattern)/4.0)::int then
   raise exception 'Invalid dash replay' using errcode='22023';
 end if;
 for v_s in select value from jsonb_array_elements_text(p_jumps) loop
   if v_s is null or v_s !~ '^[0-9]{1,3}$' then raise exception 'Invalid jump event' using errcode='22023'; end if;
   v_jump:=v_s::int;
   if v_jump < 0 or v_jump >= length(p_pattern) or v_jump-v_last<4
      or substring(p_pattern from v_jump+1 for 1)<>'.' then
     raise exception 'Impossible jump event' using errcode='22023';
   end if;
   v_last:=v_jump;v_list:=array_append(v_list,v_jump);
 end loop;
 v_last:=-5;
 for v_i in 0..length(p_pattern)-1 loop
   if v_i=any(v_list) then v_last:=v_i;end if;
   if substring(p_pattern from v_i+1 for 1)<>'.'
      and (v_i-v_last < 1 or v_i-v_last>3) then
      v_death:=v_i;exit;
   end if;
 end loop;
 if v_death is not null and exists(select 1 from unnest(v_list) x where x>v_death) then
   raise exception 'Replay events after collision' using errcode='22023';
 end if;
 return jsonb_build_object('won',v_death is null,'death_tile',v_death,
    'tiles',coalesce(v_death+1,length(p_pattern)));
end $$;

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
    or length(p_pattern) not between 24 and 90 or p_pattern !~ '^[.sbg]+$'
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
   difficulty=p_difficulty,updated_at=now()
   where id=p_level_id and creator=v_owner and kind='member' and not published
  returning id into v_id;
  if v_id is null then raise exception 'Only your unpublished draft can be edited' using errcode='42501';end if;
 end if;
 return jsonb_build_object('id',v_id,'status','draft','playtest_required',true);
end $$;

create or replace function public.community_dash_publish(p_level_id bigint)
returns jsonb language plpgsql security definer
set search_path to pg_catalog,public
as $$
declare v public.community_dash_levels%rowtype;v_owner uuid:=auth.uid();
begin
 if not public.community_dash_allowed() then raise exception 'Approved Commons membership required' using errcode='42501';end if;
 select * into v from public.community_dash_levels where id=p_level_id and creator=v_owner and kind='member' for update;
 if not found then raise exception 'Your draft level was not found' using errcode='42501';end if;
 if v.published then return jsonb_build_object('status','published','id',v.id);end if;
 if not exists(select 1 from public.community_dash_runs r where r.level_id=v.id
      and r.user_id=v_owner and r.pattern_snapshot=v.pattern and r.status='won') then
   raise exception 'Playtest and beat this exact draft before publishing' using errcode='22023';end if;
 update public.community_dash_levels set published=true,updated_at=now() where id=v.id;
 insert into public.community_dash_profiles(user_id,published_levels)
 values(v_owner,1) on conflict(user_id) do update
 set published_levels=public.community_dash_profiles.published_levels+1,updated_at=now();
 return jsonb_build_object('status','published','id',v.id);
end $$;

create or replace function public.community_dash_start(p_level_id bigint)
returns jsonb language plpgsql security definer
set search_path to pg_catalog,public
as $$
declare v public.community_dash_levels%rowtype;r public.community_dash_runs%rowtype;
 v_owner uuid:=auth.uid();v_previous bigint;
begin
 if not public.community_dash_allowed() then raise exception 'Approved Commons membership required' using errcode='42501';end if;
 select * into v from public.community_dash_levels where id=p_level_id and
    (published or (kind='member' and creator=v_owner));
 if not found then raise exception 'Level unavailable' using errcode='42501';end if;
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
 insert into public.community_dash_runs(user_id,level_id,pattern_snapshot)
 values(v_owner,v.id,v.pattern) returning * into r;
 return jsonb_build_object('run_id',r.id,'level_id',v.id,'title',v.title,
   'pattern',v.pattern,'pace_ms',210,'start_at',r.started_at);
end $$;

create or replace function public.community_dash_finish(p_run_id uuid,p_jumps jsonb)
returns jsonb language plpgsql security definer
set search_path to pg_catalog,public
as $$
declare v public.community_dash_runs%rowtype;v_level public.community_dash_levels%rowtype;
 v_owner uuid:=auth.uid();v_sim jsonb;v_won boolean;v_dead int;v_elapsed int;v_expected int;
 v_points int;v_new int;v_designer_ms int;v_designer_points int;v_badge text;
begin
 if not public.community_dash_allowed() then raise exception 'Approved Commons membership required' using errcode='42501';end if;
 select * into v from public.community_dash_runs where id=p_run_id and user_id=v_owner for update;
 if not found or v.status<>'active' then raise exception 'Run is missing or already finished' using errcode='22023';end if;
 select * into v_level from public.community_dash_levels where id=v.level_id;
 v_sim:=public.community_dash_replay(v.pattern_snapshot,p_jumps);
 v_won:=(v_sim->>'won')::boolean;v_dead:=(v_sim->>'death_tile')::int;
 v_expected:=(v_sim->>'tiles')::int*210;
 v_elapsed:=floor(extract(epoch from clock_timestamp()-v.started_at)*1000)::int;
 if v_elapsed<greatest(0,v_expected-600) then
   raise exception 'Run finished faster than the validated tile clock' using errcode='22023';end if;
 if v_elapsed>v_expected+45000 then
   update public.community_dash_runs set status='abandoned',finished_at=now() where id=v.id;
   raise exception 'Run timed out. Start again.' using errcode='22023';end if;
 update public.community_dash_runs set status=case when v_won then 'won' else 'dead' end,
  finished_at=clock_timestamp(),elapsed_ms=v_elapsed,death_tile=v_dead,jumps=p_jumps where id=v.id;
 if v_won then
  insert into public.community_dash_progress(user_id,level_id,clears,best_ms)
  values(v_owner,v.level_id,1,v_elapsed)
  on conflict(user_id,level_id) do update
  set clears=public.community_dash_progress.clears+1,
      best_ms=least(public.community_dash_progress.best_ms,excluded.best_ms);
  if v_level.published and (v_level.creator is null or v_level.creator<>v_owner) then
   v_points:=case when v_level.kind='campaign' then 100+v_level.stage*40 else 125 end;
   v_badge:=case when v_level.kind='campaign' and v_level.stage=6 then 'CAMPAIGN CROWN'
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
    select coalesce(sum(least(t.elapsed_ms,(case when t.status='won' then
        length(t.pattern_snapshot) else coalesce(t.death_tile+1,1) end)*210+1500)),0)
      into v_designer_ms from (
       select elapsed_ms,status,pattern_snapshot,death_tile from public.community_dash_runs
       where user_id=v_owner and level_id=v_level.id and status in('dead','won')
       and pattern_snapshot=v_level.pattern
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

create or replace function public.community_dash_state()
returns jsonb language plpgsql stable security definer
set search_path to pg_catalog,public
as $$
declare v_owner uuid:=auth.uid();v_levels jsonb;v_progress jsonb;
 v_awards jsonb;v_leaders jsonb;v_mine jsonb;v_active jsonb;
begin
 if not public.community_dash_allowed() then raise exception 'Approved Commons membership required' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'title',v.title,
  'kind',v.kind,'stage',v.stage,'difficulty',v.difficulty,'pattern',v.pattern,
  'creator',v.creator,'creator_name',coalesce(m.display_name,'The Family'),
  'published',v.published,'verified_solves',coalesce(s.solved,0),
  'designer_award',coalesce(a.badge,''),'designer_solve_ms',a.solve_ms)
  order by v.kind,v.stage nulls last,v.created_at desc),'[]'::jsonb)
 into v_levels from public.community_dash_levels v
 left join public.community_members m on m.user_id=v.creator and m.status='approved'
 left join lateral (select count(distinct user_id) solved from public.community_dash_progress
                 where level_id=v.id and user_id<>coalesce(v.creator,'00000000-0000-0000-0000-000000000000'::uuid)) s on true
 left join public.community_dash_awards a on a.level_id=v.id and a.award_type='designer'
 where v.published or (v.kind='member' and v.creator=v_owner);
 select coalesce(jsonb_agg(jsonb_build_object('level_id',level_id,
  'clears',clears,'best_ms',best_ms)),'[]'::jsonb)
 into v_progress from public.community_dash_progress where user_id=v_owner;
 select coalesce(jsonb_agg(jsonb_build_object('level_id',level_id,'type',award_type,
   'badge',badge,'points',points,'solve_ms',solve_ms,'earned_at',earned_at)
   order by earned_at desc),'[]'::jsonb)
 into v_awards from public.community_dash_awards where user_id=v_owner;
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
  'active',v_active,'user_id',v_owner,'pace_ms',210);
end $$;

revoke all on function public.community_dash_allowed() from PUBLIC,anon;
revoke all on function public.community_dash_replay(text,jsonb) from PUBLIC,anon,authenticated;
revoke all on function public.community_dash_state() from PUBLIC,anon;
revoke all on function public.community_dash_save(text,text,int,bigint) from PUBLIC,anon;
revoke all on function public.community_dash_publish(bigint) from PUBLIC,anon;
revoke all on function public.community_dash_start(bigint) from PUBLIC,anon;
revoke all on function public.community_dash_finish(uuid,jsonb) from PUBLIC,anon;
grant execute on function public.community_dash_allowed(),
 public.community_dash_state(),public.community_dash_save(text,text,int,bigint),
 public.community_dash_publish(bigint),public.community_dash_start(bigint),
 public.community_dash_finish(uuid,jsonb) to authenticated;
