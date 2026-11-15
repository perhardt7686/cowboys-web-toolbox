alter table public.community_dash_levels
 add column if not exists revision integer not null default 1 check(revision>=1);
alter table public.community_dash_runs
 add column if not exists level_revision integer not null default 0;
-- Older saved runs receive the previous revision only for original untouched
-- legacy drafts. Unpublished edits require a fresh verified run.
update public.community_dash_runs r set level_revision=1
from public.community_dash_levels l
where r.level_id=l.id and r.level_revision=0 and l.kind='member' and l.revision=1;


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
 insert into public.community_dash_runs(user_id,level_id,pattern_snapshot,level_revision)
 values(v_owner,v.id,v.pattern,v.revision) returning * into r;
 return jsonb_build_object('run_id',r.id,'level_id',v.id,'title',v.title,
   'pattern',v.pattern,'pace_ms',v.pace_ms,'world',v.world,'boss',v.boss,
   'boss_style',v.boss_style,'boss_name',v.boss_name,'start_at',r.started_at);
end $$;

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
 boss_name=v_boss_title,revision=revision+1,updated_at=now()
 where id=v_id and creator=auth.uid() and kind='member' and not published;
 if not found then raise exception 'Only your own unpublished drafts can be decorated' using errcode='42501';end if;
 return v_saved||jsonb_build_object('world',v_world,'boss_style',v_style,'boss',v_style<>'none','revision',
 (select revision from public.community_dash_levels where id=v_id));
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
      and r.user_id=v_owner and r.pattern_snapshot=v.pattern and r.status='won'
      and r.level_revision=v.revision) then
   raise exception 'Playtest and beat this exact draft before publishing' using errcode='22023';end if;
 update public.community_dash_levels set published=true,updated_at=now() where id=v.id;
 insert into public.community_dash_profiles(user_id,published_levels)
 values(v_owner,1) on conflict(user_id) do update
 set published_levels=public.community_dash_profiles.published_levels+1,updated_at=now();
 return jsonb_build_object('status','published','id',v.id);
end $$;

revoke all on function public.community_dash_start(bigint),public.community_dash_save_world(text,text,int,bigint,text,text),public.community_dash_publish(bigint) from PUBLIC,anon;

grant execute on function public.community_dash_start(bigint),public.community_dash_save_world(text,text,int,bigint,text,text),public.community_dash_publish(bigint) to authenticated;