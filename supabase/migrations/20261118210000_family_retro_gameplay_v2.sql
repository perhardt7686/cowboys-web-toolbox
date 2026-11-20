-- Versioned original retro-arcade Gameplay V2.
-- Fully separate score/run ledgers protect every V1 score and achievement.
-- Client deterministic mirror: docs/retro-arcade-engine-v2.mjs
begin;

create table if not exists public.community_retro_v2_runs(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 game text not null check(game in ('fleet','maze')),
 version integer not null default 2 check(version=2),
 seed integer not null check(seed between 0 and 96),
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 status text not null default 'active' check(status in ('active','finished','expired')),
 actions text,
 score integer check(score>=0),
 lives integer check(lives between 0 and 3),
 steps integer check(steps between 0 and 300)
);
create index if not exists community_retro_v2_run_user
 on public.community_retro_v2_runs(user_id,started_at desc);
create unique index if not exists community_retro_v2_one_active
 on public.community_retro_v2_runs(user_id) where status='active';

create table if not exists public.community_retro_v2_scores(
 user_id uuid not null references auth.users(id) on delete cascade,
 game text not null check(game in ('fleet','maze')),
 version integer not null default 2 check(version=2),
 runs integer not null default 0 check(runs>=0),
 best_score integer not null default 0 check(best_score>=0),
 total_points bigint not null default 0 check(total_points>=0),
 clears integer not null default 0 check(clears>=0),
 rescues integer not null default 0 check(rescues>=0),
 updated_at timestamptz not null default now(),
 primary key(user_id,game)
);
alter table public.community_retro_v2_runs enable row level security;
alter table public.community_retro_v2_scores enable row level security;
revoke all on public.community_retro_v2_runs,public.community_retro_v2_scores
 from public,anon,authenticated;

create or replace function public.community_retro_replay_v2(
 p_game text,p_seed integer,p_actions text)
returns jsonb language plpgsql immutable set search_path='' as $fn$
declare
 maze text[]:=array[
 '###############','#.............#','#.###.###.###.#','#o...#...#...o#',
 '###.#.#.#.#.###','#...#...#.#...#','#.#.###.#.#.#.#','#.#.....#...#.#',
 '#.###.###.###.#','#...#...#.....#','###.#.#.###.#.#','#...#...#...#.#',
 '#.#####.###.#.#','#.............#','###############'];
 maxsteps integer; t integer; letter text; score integer:=0; lives integer:=3; done boolean:=false;
 -- Squadron state
 lane integer:=4; wave integer; age integer; target_lane integer; target_id integer;
 destroyed integer[]:='{}'::integer[]; fire boolean; has_hit boolean; captured boolean:=false;
 rescues integer:=0; boss boolean;
 -- Maze player, tile and power state
 x integer:=1;y integer:=1; nx integer;ny integer;cell text;key text;
 dx integer;dy integer; adx integer;ady integer;
 seen text[]:='{}'::text[]; dots integer:=0;power integer:=0;
 -- Three independently walking, maze-aware ghosts
 gx integer[]:=array[13,13,7]; gy integer[]:=array[1,13,7];
 ghost_eaten integer:=0; phase text;targetx integer;targety integer;
 i integer;j integer;k integer; cx integer;cy integer; bx integer;chosen_y integer;
 dist integer;bestdist integer; collision boolean; moving boolean;
begin
 if p_game not in ('fleet','maze') or p_seed not between 0 and 96
    or p_actions is null then
   raise exception 'Invalid V2 arcade game or seed' using errcode='22023';
 end if;
 maxsteps:=case when p_game='fleet' then 240 else 300 end;
 if length(p_actions)>maxsteps
   or (p_game='fleet' and p_actions!~'^[LRFADN]*$')
   or (p_game='maze' and p_actions!~'^[LRUDN]*$') then
   raise exception 'Invalid V2 arcade replay' using errcode='22023';
 end if;
 if length(p_actions)=0 then
   return jsonb_build_object('version',2,'score',0,'lives',3,'steps',0,
    'done',false,'cleared',false,'dots',0,'captured',false,'rescues',0,'ghosts_eaten',0);
 end if;
 for t in 0..length(p_actions)-1 loop
   if done then raise exception 'V2 actions after game over' using errcode='22023';end if;
   letter:=substring(p_actions from t+1 for 1);
   if p_game='fleet' then
     wave:=t/12;age:=t%12;
     if letter in ('L','A') then lane:=greatest(0,lane-1);end if;
     if letter in ('R','D') then lane:=least(8,lane+1);end if;
     fire:=letter in ('F','A','D');has_hit:=false;
     -- Exactly one target can be hit by each trigger. Three distinct
     -- attack windows per formation, including every fifth commander.
     for i in 0..2 loop
       target_lane:=(p_seed+wave*5+i*3)%9;target_id:=wave*3+i;
       boss:=wave%5=4 and i=1;
       if fire and not has_hit and age between 1+3*i and 4+3*i
          and lane=target_lane and not(target_id=any(destroyed)) then
         destroyed:=array_append(destroyed,target_id);has_hit:=true;
         score:=score+case when boss then 90 else 20+10*i end;
         if boss and captured then
           captured:=false;rescues:=rescues+1;
           lives:=least(3,lives+1);score:=score+100;
         end if;
       end if;
     end loop;
     for i in 0..2 loop
       target_lane:=(p_seed+wave*5+i*3)%9;target_id:=wave*3+i;
       if age=4+3*i and lane=target_lane
          and not(target_id=any(destroyed)) then
         lives:=greatest(0,lives-1);
         if wave%5=4 and i=1 and lives>0 then captured:=true;end if;
       end if;
     end loop;
   else
     dx:=0;dy:=0;adx:=1;ady:=0;
     if letter='L' then dx:=-1;adx:=-1;
     elsif letter='R' then dx:=1;adx:=1;
     elsif letter='U' then dy:=-1;adx:=0;ady:=-1;
     elsif letter='D' then dy:=1;adx:=0;ady:=1;
     end if;
     nx:=x+dx;ny:=y+dy;
     if nx between 0 and 14 and ny between 0 and 14
       and substring(maze[ny+1] from nx+1 for 1)<>'#' then
       x:=nx;y:=ny;
     end if;
     key:=x::text||','||y::text;
     if not(key=any(seen)) then
       seen:=array_append(seen,key);dots:=dots+1;
       cell:=substring(maze[y+1] from x+1 for 1);
       if cell='o' then score:=score+50;power:=32;
       else score:=score+10;end if;
     end if;
     if power>0 then power:=power-1;end if;
     phase:=case when power>0 then 'frightened'
       when (t/32)%4=0 then 'scatter' else 'chase' end;
     moving:=case when phase='frightened' then t%3=0 else t%2=0 end;
     -- Hunter tracks the player; ambusher targets two tiles ahead;
     -- flanker targets the opposite quadrant. Scatter targets differ.
     if moving then
       for i in 1..3 loop
         if phase='frightened' then targetx:=x;targety:=y;
         elsif phase='scatter' then
           targetx:=case when i=3 then 1 else 13 end;
           targety:=case when i=1 then 1 else 13 end;
         elsif i=1 then targetx:=x;targety:=y;
         elsif i=2 then
           targetx:=least(13,greatest(1,x+2*adx));
           targety:=least(13,greatest(1,y+2*ady));
         else
           targetx:=least(13,greatest(1,x+case when x>=7 then -4 else 4 end));
           targety:=least(13,greatest(1,y+case when y>=7 then -3 else 3 end));
         end if;
         bx:=gx[i];chosen_y:=gy[i];
         bestdist:=case when phase='frightened' then -1 else 10000 end;
         for j in 0..3 loop
           k:=(j+(i-1)+t+p_seed)%4;
           cx:=gx[i]+case when k=0 then 1 when k=2 then -1 else 0 end;
           cy:=gy[i]+case when k=1 then 1 when k=3 then -1 else 0 end;
           if cx not between 0 and 14 or cy not between 0 and 14
              or substring(maze[cy+1] from cx+1 for 1)='#' then
             continue;
           end if;
           dist:=abs(cx-targetx)+abs(cy-targety);
           if (phase='frightened' and dist>bestdist)
                or (phase<>'frightened' and dist<bestdist) then
             bx:=cx;chosen_y:=cy;bestdist:=dist;
           end if;
         end loop;
         gx[i]:=bx;gy[i]:=chosen_y;
       end loop;
     end if;
     collision:=false;
     for i in 1..3 loop
       if gx[i]=x and gy[i]=y then
         if power>0 then
           score:=score+75;ghost_eaten:=ghost_eaten+1;
           gx[i]:=case when i=3 then 7 else 13 end;
           gy[i]:=case when i=1 then 1 when i=2 then 13 else 7 end;
         else collision:=true;
         end if;
       end if;
     end loop;
     if collision then
       lives:=greatest(0,lives-1);x:=1;y:=1;
       gx:=array[13,13,7];gy:=array[1,13,7];
     end if;
   end if;
   done:=lives=0 or t+1>=maxsteps or (p_game='maze' and dots>=106);
 end loop;
 return jsonb_build_object(
   'version',2,'score',score,'lives',lives,'steps',length(p_actions),
   'done',done,'cleared',case when p_game='fleet' then
     length(p_actions)=240 and lives>0 else dots>=106 and lives>0 end,
   'dots',dots,'captured',captured,'rescues',rescues,'ghosts_eaten',ghost_eaten);
end;
$fn$;
revoke all on function public.community_retro_replay_v2(text,integer,text)
 from public,anon,authenticated;

create or replace function public.community_retro_start_v2(p_game text)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare uid uuid:=auth.uid();seed integer;new_run uuid;
begin
 if not public.community_dash_allowed() then
   raise exception 'Approved family members only' using errcode='42501';
 end if;
 if p_game not in ('fleet','maze') then
   raise exception 'Unknown V2 game' using errcode='22023';
 end if;
 update public.community_retro_v2_runs set status='expired'
   where user_id=uid and status='active';
 seed:=floor(random()*97)::integer;
 insert into public.community_retro_v2_runs(user_id,game,seed,version)
   values(uid,p_game,seed,2) returning id into new_run;
 return jsonb_build_object('run_id',new_run,'game',p_game,'seed',seed,
  'version',2,'steps',case when p_game='fleet' then 240 else 300 end);
end;
$fn$;
revoke all on function public.community_retro_start_v2(text) from public;
grant execute on function public.community_retro_start_v2(text) to authenticated;

create or replace function public.community_retro_finish_v2(p_run_id uuid,p_actions text)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare uid uuid:=auth.uid();r public.community_retro_v2_runs%rowtype;
 outcome jsonb;points integer;survivors integer;steps integer;cleared boolean;
 rescues integer;ms double precision;cap integer;
begin
 if not public.community_dash_allowed() then
   raise exception 'Approved family members only' using errcode='42501';
 end if;
 select * into r from public.community_retro_v2_runs
   where id=p_run_id and user_id=uid for update;
 if not found or r.status<>'active' or r.version<>2 then
   raise exception 'Active V2 game run not found' using errcode='22023';
 end if;
 cap:=case when r.game='fleet' then 240 else 300 end;
 if p_actions is null or length(p_actions)<8 or length(p_actions)>cap then
   raise exception 'Incomplete V2 game trace' using errcode='22023';
 end if;
 ms:=extract(epoch from clock_timestamp()-r.started_at)*1000;
 if ms<length(p_actions)*35 or ms>1800000 then
   raise exception 'V2 timing could not be verified' using errcode='22023';
 end if;
 outcome:=public.community_retro_replay_v2(r.game,r.seed,p_actions);
 points:=(outcome->>'score')::integer;survivors:=(outcome->>'lives')::integer;
 steps:=(outcome->>'steps')::integer;cleared:=(outcome->>'cleared')::boolean;
 rescues:=(outcome->>'rescues')::integer;
 update public.community_retro_v2_runs set actions=p_actions,
   finished_at=now(),status='finished',score=points,lives=survivors,steps=steps
   where id=p_run_id;
 insert into public.community_retro_v2_scores(
   user_id,game,version,runs,best_score,total_points,clears,rescues)
 values(uid,r.game,2,1,points,points,case when cleared then 1 else 0 end,rescues)
 on conflict(user_id,game) do update set
   runs=public.community_retro_v2_scores.runs+1,
   best_score=greatest(public.community_retro_v2_scores.best_score,excluded.best_score),
   total_points=public.community_retro_v2_scores.total_points+excluded.total_points,
   clears=public.community_retro_v2_scores.clears+excluded.clears,
   rescues=public.community_retro_v2_scores.rescues+excluded.rescues,
   updated_at=now();
 -- V2 explicitly does NOT write legacy scores or award V1 cosmetics.
 return outcome;
end;
$fn$;
revoke all on function public.community_retro_finish_v2(uuid,text) from public;
grant execute on function public.community_retro_finish_v2(uuid,text) to authenticated;

create or replace function public.community_retro_state_v2()
returns jsonb language plpgsql stable security definer set search_path='' as $fn$
declare uid uuid:=auth.uid();
begin
 if not public.community_dash_allowed() then
   raise exception 'Approved family members only' using errcode='42501';
 end if;
 return jsonb_build_object(
  'version',2,
  'mine',coalesce((select jsonb_agg(jsonb_build_object(
    'game',game,'runs',runs,'best',best_score,'points',total_points,
    'clears',clears,'rescues',rescues))
    from public.community_retro_v2_scores where user_id=uid),'[]'::jsonb),
  'leaders',coalesce((select jsonb_agg(item) from (
    select jsonb_build_object('name',m.display_name,'game',s.game,
      'best',s.best_score,'runs',s.runs,'rescues',s.rescues) as item
    from public.community_retro_v2_scores s
    join public.community_members m on m.user_id=s.user_id and m.status='approved'
    order by s.best_score desc limit 40
  ) leaders),'[]'::jsonb));
end;
$fn$;
revoke all on function public.community_retro_state_v2() from public;
grant execute on function public.community_retro_state_v2() to authenticated;

commit;
