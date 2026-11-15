create or replace function public.community_dash_boss_profile(p_stage int)
returns jsonb language plpgsql immutable
set search_path to pg_catalog,public
as $$
declare v_slot int;v_rank int;v_names text[]:=array['Thorn Monarch','Chrono Colossus','Prism Serpent','Skybreaker Sentinel','Solar Sandwyrm','Volt Leviathan','Abyssal Lantern','Magma Titan','Glitch Sovereign','Moonbloom Guardian','Astral Devourer','Aurora Warden'];
 v_keys text[]:=array['canopy','clockwork','crystal','skyglass','solar','thunder','reef','volcanic','pixel','garden','starfall','aurora'];
begin
 if p_stage is null or p_stage<25 or p_stage>1000000000 or p_stage%25<>0 then
  raise exception 'Bosses only appear at stages divisible by 25' using errcode='22023';
 end if;
 v_slot:=((((p_stage-7)/25)%12)+1);
 v_rank:=1+((p_stage/25-1)/12);
 return jsonb_build_object('stage',p_stage,'style',v_keys[v_slot],'name',case when v_rank>1 then v_names[v_slot]||' · ASCENSION '||v_rank else v_names[v_slot] end,
  'boss_number',p_stage/25,'ascension',v_rank,'phase_count',3,'pattern_version','BOSS3',
  'arena_tiles',90,'same_for_every_member',true);
end $$;
revoke all on function public.community_dash_boss_profile(int) from PUBLIC,anon,authenticated;