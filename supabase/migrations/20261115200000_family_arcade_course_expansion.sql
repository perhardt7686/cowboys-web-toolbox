-- Snapshot course geometry for verified replays and retain every existing run and level.
begin;

alter table public.community_boardride_runs
  add column course_edition smallint not null default 1 check(course_edition in (1,2));
alter table public.community_dash_levels
  add column soundtrack text not null default 'pulse'
    check(soundtrack in ('pulse','hangar','circuit','ember','tide'));

alter table public.community_dash_levels drop constraint community_dash_levels_pattern_check;
alter table public.community_dash_levels add constraint community_dash_levels_pattern_check
  check(length(pattern) between 24 and 90 and pattern ~ '^[.sbglwcpfrmodhCSBUWRPVIFLEJOMKDTHANQ]+$');

create function public.community_boardride_open_run(p_board text,p_share boolean,p_edition smallint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_data jsonb;v_owner uuid;v_id uuid;v_stage integer;v_seed integer;v_ghost jsonb;
begin
  v_owner:=public.community_boardride_allowed();
  if (select count(*) from public.community_boardride_runs where user_id=v_owner
        and started_at>now()-interval '60 seconds')>=14 then
    raise exception 'Wait a moment before starting another race' using errcode='22023';
  end if;
  v_data:=public.community_boardride_start(p_board);
  v_id:=(v_data->>'run_id')::uuid;
  v_stage:=(v_data->>'stage')::integer;
  v_seed:=(v_stage*212561)#196930;
  update public.community_boardride_runs
  set seed=v_seed,physics_version=2,share_replay=coalesce(p_share,false),course_edition=p_edition
  where id=v_id;
  select jsonb_build_object('name',coalesce(nullif(m.display_name,''),'Family member'),
    'frames',r.replay_frames,'time_ms',r.elapsed_ms,'board',r.board)
  into v_ghost from public.community_boardride_runs r
  join public.community_members m on m.user_id=r.user_id and m.status='approved'
  where r.stage=v_stage and r.seed=v_seed and r.physics_version=2 and r.share_replay
    and r.course_edition=p_edition and r.status='finished' and r.user_id<>v_owner and r.replay_frames is not null
  order by r.elapsed_ms,r.finished_at limit 1;
  return v_data||jsonb_build_object('seed',v_seed,'ghost',v_ghost,'edition',p_edition);
end;
$$;

create or replace function public.community_boardride_start_v2(p_board text,p_share boolean default false)
returns jsonb language sql security definer set search_path='' as $$
  select public.community_boardride_open_run(p_board,p_share,1::smallint);
$$;

create function public.community_boardride_start_v3(p_board text,p_share boolean default false)
returns jsonb language sql security definer set search_path='' as $$
  select public.community_boardride_open_run(p_board,p_share,2::smallint);
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
    or length(p_pattern) not between 24 and 90 or p_pattern !~ '^[.sbglwcpfrmodhCSBUWRPVIFLEJOMKDTHANQ]+$'
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

create function public.community_dash_save_v3(
  p_title text,p_pattern text,p_difficulty integer,p_level_id bigint,p_world text,p_boss_style text,p_layout jsonb,p_song text
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_data jsonb;v_item jsonb;v_tile integer;v_previous integer:=-1;
begin
  if not public.community_dash_allowed() then raise exception 'Approved family membership required' using errcode='42501';end if;
  if p_song is null or p_song not in ('pulse','hangar','circuit','ember','tide') then
    raise exception 'Choose a soundtrack from the studio' using errcode='22023';
  end if;
  if jsonb_typeof(p_layout) is distinct from 'array' then
    raise exception 'Invalid track layout' using errcode='22023';
  end if;
  if jsonb_array_length(p_layout)>90 then raise exception 'Too many tile transforms' using errcode='22023';end if;
  for v_item in select value from jsonb_array_elements(p_layout) loop
    if v_item::text !~ '^\[[0-9]{1,2}, [0-3], [1-3], [01], [0-2](, "[.sblwcpfrmodhH]", "[.CSBUWRPVIFLEKTQ]")?\]$' then
      raise exception 'Invalid tile transform' using errcode='22023';
    end if;
    v_tile:=(v_item->>0)::integer;
    if v_tile<=v_previous or v_tile<4 or v_tile>=length(p_pattern)-4 or
      (substring(p_pattern from v_tile+1 for 1) !~ '^[sblwcpfrmodhDMOH]$'
         and (v_item->>1<>'0' or v_item->>2<>'2' or v_item->>3<>'0'))
      or (v_item->>3<>'0' and substring(p_pattern from v_tile+1 for 1) !~ '^[scf]$') then
      raise exception 'This tile cannot use that transform' using errcode='22023';
    end if;
    v_previous:=v_tile;
  end loop;
  v_data:=public.community_dash_save_world(p_title,p_pattern,p_difficulty,p_level_id,p_world,p_boss_style);
  update public.community_dash_levels set layout=p_layout,soundtrack=p_song,physics_version=2
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
  'boss_style',v.boss_style,'boss_name',v.boss_name,'layout',v.layout,'soundtrack',v.soundtrack,
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

create or replace function public.community_dash_start_v2(p_level_id bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_data jsonb;
begin
  v_data:=public.community_dash_open_run(p_level_id,true);
  if v_data->>'pattern' ~ '[HANQ]' or exists (
    select 1 from jsonb_array_elements(v_data->'layout') as transform(item)
    where jsonb_array_length(transform.item)=7
  ) then
    raise exception 'Refresh the board to play this updated course' using errcode='22023';
  end if;
  return v_data;
end;
$$;

create function public.community_dash_start_v3(p_level_id bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_data jsonb;v_soundtrack text;
begin
  v_data:=public.community_dash_open_run(p_level_id,true);
  update public.community_dash_runs
  set physics_rules=physics_rules||jsonb_build_object('edition',2)
  where id=(v_data->>'run_id')::uuid and user_id=auth.uid();
  select soundtrack into v_soundtrack from public.community_dash_levels where id=p_level_id;
  return v_data||jsonb_build_object('edition',2,'soundtrack',v_soundtrack);
end;
$$;

create or replace function public.community_arcade_replay_input(p_owner uuid,p_game text,p_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_result jsonb;
begin
  if not exists(select 1 from public.community_members where user_id=p_owner and status='approved') then
    raise exception 'Approved Family Message Board membership required' using errcode='42501';
  end if;
  if p_game='skyboard' then
    select jsonb_build_object('stage',stage,'seed',seed,'board',board,'sample',share_replay,'edition',course_edition) into v_result
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

revoke all on function public.community_boardride_open_run(text,boolean,smallint)
  from public,anon,authenticated;
revoke all on function public.community_boardride_start_v3(text,boolean),
  public.community_dash_start_v3(bigint),
  public.community_dash_save_v3(text,text,integer,bigint,text,text,jsonb,text)
  from public,anon,authenticated;
grant execute on function public.community_boardride_start_v3(text,boolean),
  public.community_dash_start_v3(bigint),
  public.community_dash_save_v3(text,text,integer,bigint,text,text,jsonb,text)
  to authenticated;

commit;
