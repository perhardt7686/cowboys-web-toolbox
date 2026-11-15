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
   case when v_boss then left(v_boss_title,58-length(' · BOSS '||p_stage::text))||' · BOSS '||p_stage else v_world||' · STAGE '||p_stage end,
   v_difficulty,v_pattern,true,v_world,v_pace,v_boss,
   coalesce(v_boss_style,'none'),v_boss_title)
 on conflict(kind,stage) do nothing;
 select id into v_id from public.community_dash_levels where kind='campaign' and stage=p_stage;
 return v_id;
end $$;
revoke all on function public.community_dash_ensure_stage(int) from PUBLIC,anon;
grant execute on function public.community_dash_ensure_stage(int) to authenticated;