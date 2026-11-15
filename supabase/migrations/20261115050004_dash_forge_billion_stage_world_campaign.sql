
-- Infinite-in-practice campaign. The first six original stages remain unchanged.
-- Other stages are materialized lazily for approved family members.
alter table public.community_dash_levels drop constraint if exists community_dash_kind;
alter table public.community_dash_levels add constraint community_dash_kind
 check((kind='campaign' and creator is null and stage between 1 and 1000000000)
 or (kind='member' and creator is not null and stage is null));
alter table public.community_dash_levels add column if not exists world text not null default 'Origin Circuit';
alter table public.community_dash_levels add column if not exists pace_ms int not null default 210 check(pace_ms between 110 and 250);
alter table public.community_dash_levels add column if not exists boss boolean not null default false;
update public.community_dash_levels set world='Origin Circuit',pace_ms=210 where kind='campaign' and stage<=6;

create or replace function public.community_dash_ensure_stage(p_stage int)
returns bigint language plpgsql security definer
set search_path to pg_catalog,public
as $$
declare v_id bigint;v_current int;v_world_no int;v_world text;
 v_worlds text[]:=array['Neon Canopy','Clockwork Harbor','Crystal Hollow',
 'Skyglass City','Solar Dunes','Thunder Rails','Abyssal Reef','Volcanic Foundry',
 'Pixel Metropolis','Moonlit Gardens','Starfall Observatory','Endless Aurora'];
 v_hazards text;v_pattern text:='';v_cell text;v_i int;v_length int;
 v_interval int;v_pace int;v_boss boolean;v_difficulty int;v_hazard_no int;
begin
 if not public.community_dash_allowed() then raise exception 'Approved family membership required' using errcode='42501';end if;
 if p_stage not between 1 and 1000000000 then raise exception 'Campaign stage must be within the supported bound' using errcode='22023';end if;
 select coalesce(max(l.stage),0)+1 into v_current from public.community_dash_progress pr
 join public.community_dash_levels l on l.id=pr.level_id and l.kind='campaign'
 where pr.user_id=auth.uid() and pr.clears>0;
 if p_stage>least(1000000000,v_current+12) then
  raise exception 'Clear preceding chapters before generating distant stages' using errcode='22023';end if;
 select id into v_id from public.community_dash_levels where kind='campaign' and stage=p_stage;
 if v_id is not null then return v_id; end if;
 if p_stage<=6 then raise exception 'Original campaign chapter is missing' using errcode='22023';end if;
 v_world_no:=(((p_stage-7)/25)%12)+1;
 v_world:=v_worlds[v_world_no];
 v_hazards:=case v_world_no
 when 1 then 'sbglwp' when 2 then 'sbgwdh' when 3 then 'sbgcrw'
 when 4 then 'sbgldo' when 5 then 'sbgfpr' when 6 then 'sbgwlhd'
 when 7 then 'sbgocm' when 8 then 'sbgfpw' when 9 then 'sbglrd'
 when 10 then 'sbgmch' when 11 then 'sbgolr' else 'sbgcdf' end;
 v_boss:=p_stage%25=0;
 v_length:=case when v_boss then 90 else 48+(p_stage::bigint*17%43)::int end;
 v_interval:=case when v_boss then 5 else greatest(5,9-least(4,p_stage/35)) end;
 v_pace:=greatest(125,205-(least(80,(p_stage/14)*2)));
 v_difficulty:=case when v_boss then 6 else least(6,1+((p_stage-1)/10)%6) end;
 for v_i in 0..v_length-1 loop
  if v_i>=6 and v_i<v_length-4 and (v_i-6)%v_interval=0 then
   v_hazard_no:=get_byte(decode(md5(p_stage::text||':'||v_i::text),'hex'),0)%length(v_hazards)+1;
   v_cell:=substr(v_hazards,v_hazard_no,1);
  else v_cell:='.';end if;
  v_pattern:=v_pattern||v_cell;
 end loop;
 insert into public.community_dash_levels(kind,stage,title,difficulty,pattern,published,world,pace_ms,boss)
 values('campaign',p_stage,
   case when v_boss then v_world||' · FINAL TRIAL '||p_stage else v_world||' · STAGE '||p_stage end,
   v_difficulty,v_pattern,true,v_world,v_pace,v_boss)
 on conflict(kind,stage) do nothing;
 select id into v_id from public.community_dash_levels where kind='campaign' and stage=p_stage;
 return v_id;
end $$;
revoke all on function public.community_dash_ensure_stage(int) from PUBLIC,anon;
grant execute on function public.community_dash_ensure_stage(int) to authenticated;


create or replace function public.community_dash_replay(p_pattern text,p_jumps jsonb)
returns jsonb language plpgsql immutable
set search_path to pg_catalog,public
as $$
declare v_last int := -5; v_jump int; v_i int; v_death int := null;
  v_list integer[] := '{}'::integer[]; v_s text;
begin
 if p_pattern is null or length(p_pattern) not between 24 and 90 or p_pattern !~ '^[.sbglwcpfrmodh]+$'
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
    or length(p_pattern) not between 24 and 90 or p_pattern !~ '^[.sbglwcpfrmodh]+$'
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
   'pattern',v.pattern,'pace_ms',v.pace_ms,'world',v.world,'boss',v.boss,'start_at',r.started_at);
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
 v_expected:=(v_sim->>'tiles')::int*v_level.pace_ms;
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
    select coalesce(sum(least(t.elapsed_ms,(case when t.status='won' then
        length(t.pattern_snapshot) else coalesce(t.death_tile+1,1) end)*v_level.pace_ms+1500)),0)
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



revoke all on function public.community_dash_replay(text,jsonb) from PUBLIC,anon,authenticated;
revoke all on function public.community_dash_ensure_stage(int) from PUBLIC,anon;
revoke all on function public.community_dash_state() from PUBLIC,anon;
revoke all on function public.community_dash_save(text,text,int,bigint) from PUBLIC,anon;
revoke all on function public.community_dash_start(bigint) from PUBLIC,anon;
revoke all on function public.community_dash_finish(uuid,jsonb) from PUBLIC,anon;
grant execute on function public.community_dash_ensure_stage(int),
 public.community_dash_state(),public.community_dash_save(text,text,int,bigint),
 public.community_dash_start(bigint),public.community_dash_finish(uuid,jsonb) to authenticated;
