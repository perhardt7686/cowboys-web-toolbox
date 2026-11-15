
alter table public.community_dash_levels
 add column if not exists boss_style text not null default 'none',
 add column if not exists boss_name text;
-- Freeze existing saved stages, even as new bosses receive a more
-- elaborate three-phase attack pattern.
do $$ begin
 if exists(select 1 from public.community_dash_levels where kind='campaign' and stage%25=0 and boss_style='none') then
   raise exception 'Existing campaign boss stages need an explicit freeze/migration review';
 end if;
end $$;



-- Every boss is a pure function of the public stage number.
-- No user ID, client randomness or local clock enters the boss blueprint.
create or replace function public.community_dash_boss_profile(p_stage int)
returns jsonb language plpgsql immutable
set search_path to pg_catalog,public
as $$
declare v_slot int;v_names text[]:=array['Thorn Monarch','Chrono Colossus','Prism Serpent','Skybreaker Sentinel','Solar Sandwyrm','Volt Leviathan','Abyssal Lantern','Magma Titan','Glitch Sovereign','Moonbloom Guardian','Astral Devourer','Aurora Warden'];
 v_keys text[]:=array['canopy','clockwork','crystal','skyglass','solar','thunder','reef','volcanic','pixel','garden','starfall','aurora'];
begin
 if p_stage is null or p_stage<25 or p_stage>1000000000 or p_stage%25<>0 then
  raise exception 'Bosses only appear at stages divisible by 25' using errcode='22023';
 end if;
 v_slot:=((((p_stage-7)/25)%12)+1);
 return jsonb_build_object('stage',p_stage,'style',v_keys[v_slot],'name',v_names[v_slot],
  'boss_number',p_stage/25,'phase_count',3,'pattern_version','BOSS3',
  'arena_tiles',90,'same_for_every_member',true);
end $$;
revoke all on function public.community_dash_boss_profile(int) from PUBLIC,anon,authenticated;


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
 v_boss_title text;v_boss_style text;v_phase int;v_phase_hazards text;v_attack_list text[];
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
 if v_boss then
  select bp->>'name',bp->>'style' into v_boss_title,v_boss_style
  from (select public.community_dash_boss_profile(p_stage) bp) q;
  v_attack_list:=case v_boss_style
   when 'canopy' then array['csf','wmp','slo']
   when 'clockwork' then array['bph','wdl','rws']
   when 'crystal' then array['cgr','wlc','poc']
   when 'skyglass' then array['dls','wro','lhd']
   when 'solar' then array['fpm','wfs','roh']
   when 'thunder' then array['ldo','wlh','rdo']
   when 'reef' then array['gom','dcr','wgo']
   when 'volcanic' then array['fph','wfo','sfl']
   when 'pixel' then array['bdr','wdl','rho']
   when 'garden' then array['mcp','wfm','orh']
   when 'starfall' then array['odc','rlw','hdr']
   else array['csf','lom','wdh'] end;
 end if;
 v_length:=case when v_boss then 90 else 48+(p_stage::bigint*17%43)::int end;
 v_interval:=case when v_boss then 5 else greatest(5,9-least(4,p_stage/35)) end;
 v_pace:=greatest(125,205-(least(80,(p_stage/14)*2)));
 v_difficulty:=case when v_boss then 6 else least(6,1+((p_stage-1)/10)%6) end;
 for v_i in 0..v_length-1 loop
  if v_i>=6 and v_i<v_length-4 and (v_i-6)%v_interval=0 then
   if v_boss then
    v_phase:=least(3,1+(v_i*3/v_length));
    v_phase_hazards:=v_attack_list[v_phase];
    v_hazard_no:=get_byte(decode(md5('BOSS3:'||p_stage::text||':'||v_i::text),'hex'),0)%length(v_phase_hazards)+1;
    v_cell:=substr(v_phase_hazards,v_hazard_no,1);
   else
    v_hazard_no:=get_byte(decode(md5(p_stage::text||':'||v_i::text),'hex'),0)%length(v_hazards)+1;
    v_cell:=substr(v_hazards,v_hazard_no,1);
   end if;
  else v_cell:='.';end if;
  v_pattern:=v_pattern||v_cell;
 end loop;
 insert into public.community_dash_levels(kind,stage,title,difficulty,pattern,published,world,pace_ms,boss,boss_style,boss_name)
 values('campaign',p_stage,
   case when v_boss then v_boss_title||' · BOSS '||p_stage else v_world||' · STAGE '||p_stage end,
   v_difficulty,v_pattern,true,v_world,v_pace,v_boss,
   coalesce(v_boss_style,'none'),v_boss_title)
 on conflict(kind,stage) do nothing;
 select id into v_id from public.community_dash_levels where kind='campaign' and stage=p_stage;
 return v_id;
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
   'pattern',v.pattern,'pace_ms',v.pace_ms,'world',v.world,'boss',v.boss,
   'boss_style',v.boss_style,'boss_name',v.boss_name,'start_at',r.started_at);
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
  'boss_style',v.boss_style,'boss_name',v.boss_name,
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


-- Creator stages are a separate domain; modifying this does NOT change
-- any shared campaign stage or enemy for other family members.
create or replace function public.community_dash_save_world(
 p_title text,p_pattern text,p_difficulty int,p_level_id bigint,p_world text,p_boss_style text)
returns jsonb language plpgsql security definer
set search_path to pg_catalog,public
as $$
declare v_saved jsonb;v_id bigint;v_style text:=coalesce(p_boss_style,'none');
 v_world text:=coalesce(p_world,'Maker Studio');
 v_worlds text[]:=array['Maker Studio','Origin Circuit','Neon Canopy',
 'Clockwork Harbor','Crystal Hollow','Skyglass City','Solar Dunes',
 'Thunder Rails','Abyssal Reef','Volcanic Foundry','Pixel Metropolis',
 'Moonlit Gardens','Starfall Observatory','Endless Aurora'];
 v_styles text[]:=array['none','canopy','clockwork','crystal','skyglass','solar','thunder','reef','volcanic','pixel','garden','starfall','aurora'];
 v_boss_title text;
begin
 if not public.community_dash_allowed() then raise exception 'Approved family membership required' using errcode='42501';end if;
 if not (v_world=any(v_worlds)) or not (v_style=any(v_styles)) then
  raise exception 'Invalid world or boss archetype' using errcode='22023';
 end if;
 v_saved:=public.community_dash_save(p_title,p_pattern,p_difficulty,p_level_id);
 v_id:=(v_saved->>'id')::bigint;
 v_boss_title:=case v_style
 when 'canopy' then 'Thorn Monarch'
 when 'clockwork' then 'Chrono Colossus'
 when 'crystal' then 'Prism Serpent'
 when 'skyglass' then 'Skybreaker Sentinel'
 when 'solar' then 'Solar Sandwyrm'
 when 'thunder' then 'Volt Leviathan'
 when 'reef' then 'Abyssal Lantern'
 when 'volcanic' then 'Magma Titan'
 when 'pixel' then 'Glitch Sovereign'
 when 'garden' then 'Moonbloom Guardian'
 when 'starfall' then 'Astral Devourer'
 when 'aurora' then 'Aurora Warden'
 else null end;
 update public.community_dash_levels
 set world=v_world,boss=(v_style<>'none'),boss_style=v_style,
 boss_name=v_boss_title,updated_at=now()
 where id=v_id and creator=auth.uid() and kind='member' and not published;
 if not found then raise exception 'Only your own unpublished drafts can be decorated' using errcode='42501';end if;
 return v_saved||jsonb_build_object('world',v_world,'boss_style',v_style,'boss',v_style<>'none');
end $$;
revoke all on function public.community_dash_save_world(text,text,int,bigint,text,text) from PUBLIC,anon;
grant execute on function public.community_dash_save_world(text,text,int,bigint,text,text) to authenticated;
