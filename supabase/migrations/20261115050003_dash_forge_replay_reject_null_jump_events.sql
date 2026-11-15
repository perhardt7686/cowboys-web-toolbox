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

revoke all on function public.community_dash_replay(text,jsonb) from PUBLIC,anon,authenticated;