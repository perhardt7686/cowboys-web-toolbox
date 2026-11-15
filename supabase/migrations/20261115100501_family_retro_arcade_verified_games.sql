-- Two original, fully private family arcade games.
-- Browser renders the controls; PostgreSQL independently replays every action.
-- The client never supplies an authoritative score or trophy.
begin;
create table if not exists public.community_retro_runs(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 game text not null check(game in ('fleet','maze')),
 seed integer not null check(seed between 0 and 96),
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 status text not null default 'active' check(status in ('active','finished','expired')),
 actions text,
 score integer check(score>=0),
 lives integer check(lives between 0 and 3),
 steps integer check(steps between 0 and 300)
);
create index if not exists community_retro_run_user on public.community_retro_runs(user_id,started_at desc);
create unique index if not exists community_retro_one_active on public.community_retro_runs(user_id) where status='active';
create table if not exists public.community_retro_scores(
 user_id uuid not null references auth.users(id) on delete cascade,
 game text not null check(game in ('fleet','maze')),
 runs integer not null default 0 check(runs>=0),
 best_score integer not null default 0 check(best_score>=0),
 total_points bigint not null default 0 check(total_points>=0),
 clears integer not null default 0 check(clears>=0),
 updated_at timestamptz not null default now(),
 primary key(user_id,game)
);
create table if not exists public.community_retro_trophies(
 user_id uuid not null references auth.users(id) on delete cascade,
 game text not null check(game in ('fleet','maze')),
 trophy text not null check(trophy in ('first-run','bronze','silver','gold','legendary')),
 score integer not null check(score>=0),
 earned_at timestamptz not null default now(),
 primary key(user_id,game,trophy)
);
alter table public.community_retro_runs enable row level security;
alter table public.community_retro_scores enable row level security;
alter table public.community_retro_trophies enable row level security;
revoke all on public.community_retro_runs,public.community_retro_scores,public.community_retro_trophies from public,anon,authenticated;

create or replace function public.community_retro_replay(p_game text,p_seed integer,p_actions text)
returns jsonb language plpgsql immutable set search_path='' as $fn$
declare
 maze text[]:=array[
 '###############','#.............#','#.###.###.###.#','#o...#...#...o#',
 '###.#.#.#.#.###','#...#...#.#...#','#.#.###.#.#.#.#','#.#.....#...#.#',
 '#.###.###.###.#','#...#...#.....#','###.#.#.###.#.#','#...#...#...#.#',
 '#.#####.###.#.#','#.............#','###############'];
 maxsteps integer;
 t integer;letter text;lane integer:=4;wave integer;age integer;enemy integer;
 destroyed integer[]:='{}'::integer[];hit boolean;collision boolean;
 x integer:=1;y integer:=1;nx integer;ny integer;cell text;key text;
 seen text[]:='{}'::text[];dots integer:=0;power integer:=0;
 gx integer;gy integer;score integer:=0;lives integer:=3;done boolean:=false;
begin
 if p_game not in ('fleet','maze') or p_seed not between 0 and 96
   or p_actions is null then
   raise exception 'Invalid arcade game or seed' using errcode='22023';
 end if;
 maxsteps:=case when p_game='fleet' then 240 else 300 end;
 if length(p_actions)>maxsteps or
  (p_game='fleet' and p_actions!~'^[LRFADN]*$') or
  (p_game='maze' and p_actions!~'^[LRUDN]*$') then
   raise exception 'Invalid arcade replay' using errcode='22023';
 end if;
 if length(p_actions)=0 then
   return jsonb_build_object('score',0,'lives',3,'steps',0,'done',false,'cleared',false,'dots',0);
 end if;
 for t in 0..length(p_actions)-1 loop
   if done then raise exception 'Actions after game over' using errcode='22023';end if;
   letter:=substring(p_actions from t+1 for 1);
   if p_game='fleet' then
     wave:=t/9;age:=t%9;enemy:=(wave*5+p_seed)%9;
     if letter in ('L','A') then lane:=greatest(0,lane-1);end if;
     if letter in ('R','D') then lane:=least(8,lane+1);end if;
     hit:=letter in ('F','A','D') and age between 1 and 6
       and lane=enemy and not (wave=any(destroyed));
     if hit then
       destroyed:=array_append(destroyed,wave);
       score:=score+case when wave%5=4 then 80 else 20 end;
     end if;
     collision:=age=7 and lane=enemy and not(wave=any(destroyed));
     if collision then lives:=greatest(0,lives-1);end if;
   else
     nx:=x;ny:=y;
     if letter='L' then nx:=x-1;
     elsif letter='R' then nx:=x+1;
     elsif letter='U' then ny:=y-1;
     elsif letter='D' then ny:=y+1;end if;
     if nx between 0 and 14 and ny between 0 and 14 and
       substring(maze[ny+1] from nx+1 for 1)<>'#' then
       x:=nx;y:=ny;
     end if;
     key:=x::text||','||y::text;
     if not (key=any(seen)) then
       seen:=array_append(seen,key);dots:=dots+1;
       cell:=substring(maze[y+1] from x+1 for 1);
       if cell='o' then score:=score+50;power:=24;
       else score:=score+10;end if;
     end if;
     if power>0 then power:=power-1;end if;
     if (y=1 and x=1+((t/4+p_seed)%13))
       or (y=13 and x=1+((t/6+p_seed)%13))
       or (y=7 and x=3+((t/3+p_seed)%5)) then
       if power=0 then
         lives:=greatest(0,lives-1);x:=1;y:=1;
       end if;
     end if;
   end if;
   done:=lives=0 or t+1>=maxsteps or (p_game='maze' and dots>=106);
 end loop;
 return jsonb_build_object('score',score,'lives',lives,
   'steps',length(p_actions),'done',done,
   'cleared',case when p_game='fleet' then
        length(p_actions)=240 and lives>0 else dots>=106 and lives>0 end,
   'dots',dots);
end;
$fn$;
revoke all on function public.community_retro_replay(text,integer,text) from public,anon,authenticated;

create or replace function public.community_retro_start(p_game text)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare uid uuid:=auth.uid();seed integer;run_id uuid;
begin
 if not public.community_dash_allowed() then
   raise exception 'Approved family members only' using errcode='42501';
 end if;
 if p_game not in ('fleet','maze') then
   raise exception 'Unknown game' using errcode='22023';
 end if;
 update public.community_retro_runs set status='expired'
  where user_id=uid and status='active';
 seed:=floor(random()*97)::integer;
 insert into public.community_retro_runs(user_id,game,seed)
  values(uid,p_game,seed) returning id into run_id;
 return jsonb_build_object('run_id',run_id,'game',p_game,'seed',seed,
   'steps',case when p_game='fleet' then 240 else 300 end);
end;
$fn$;
revoke all on function public.community_retro_start(text) from public;
grant execute on function public.community_retro_start(text) to authenticated;

create or replace function public.community_retro_finish(p_run_id uuid,p_actions text)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare uid uuid:=auth.uid();r public.community_retro_runs%rowtype;
 outcome jsonb;points integer;survivors integer;steps integer;cleared boolean;
 ms double precision;win integer;cap integer;trophy text;threshold integer;
begin
 if not public.community_dash_allowed() then
   raise exception 'Approved family members only' using errcode='42501';
 end if;
 select * into r from public.community_retro_runs
   where id=p_run_id and user_id=uid for update;
 if not found or r.status<>'active' then
   raise exception 'Active game run not found' using errcode='22023';
 end if;
 cap:=case when r.game='fleet' then 240 else 300 end;
 if p_actions is null or length(p_actions)<8 or length(p_actions)>cap then
   raise exception 'Incomplete or oversized game trace' using errcode='22023';
 end if;
 ms:=extract(epoch from clock_timestamp()-r.started_at)*1000;
 if ms<length(p_actions)*35 or ms>1800000 then
   raise exception 'Arcade timing could not be verified' using errcode='22023';
 end if;
 outcome:=public.community_retro_replay(r.game,r.seed,p_actions);
 points:=(outcome->>'score')::integer;survivors:=(outcome->>'lives')::integer;
 steps:=(outcome->>'steps')::integer;cleared:=(outcome->>'cleared')::boolean;
 update public.community_retro_runs set actions=p_actions,
  finished_at=now(),status='finished',score=points,lives=survivors,steps=steps
  where id=p_run_id;
 win:=case when cleared then 1 else 0 end;
 insert into public.community_retro_scores(user_id,game,runs,best_score,total_points,clears)
  values(uid,r.game,1,points,points,win)
  on conflict(user_id,game) do update set
   runs=public.community_retro_scores.runs+1,
   best_score=greatest(public.community_retro_scores.best_score,excluded.best_score),
   total_points=public.community_retro_scores.total_points+excluded.total_points,
   clears=public.community_retro_scores.clears+excluded.clears,
   updated_at=now();
 for trophy,threshold in select * from (values
  ('first-run'::text,0),
  ('bronze'::text,case when r.game='fleet' then 60 else 100 end),
  ('silver'::text,case when r.game='fleet' then 200 else 250 end),
  ('gold'::text,case when r.game='fleet' then 400 else 450 end),
  ('legendary'::text,case when r.game='fleet' then 650 else 700 end)
 ) as goals(trophy,threshold) loop
   if points>=threshold then
     insert into public.community_retro_trophies(user_id,game,trophy,score)
       values(uid,r.game,trophy,points)
       on conflict(user_id,game,trophy) do nothing;
   end if;
 end loop;
 perform community_private.avatar_reward_award(uid,community_private.avatar_reward_metrics(uid));
 return outcome||jsonb_build_object('trophies',
   (select coalesce(jsonb_agg(trophy order by
     case trophy when 'first-run' then 0 when 'bronze' then 1 when 'silver' then 2
     when 'gold' then 3 else 4 end),'[]'::jsonb)
     from public.community_retro_trophies
     where user_id=uid and game=r.game));
end;
$fn$;
revoke all on function public.community_retro_finish(uuid,text) from public;
grant execute on function public.community_retro_finish(uuid,text) to authenticated;

create or replace function public.community_retro_state()
returns jsonb language plpgsql stable security definer set search_path='' as $fn$
declare uid uuid:=auth.uid();
begin
 if not public.community_dash_allowed() then
   raise exception 'Approved family members only' using errcode='42501';
 end if;
 return jsonb_build_object(
  'mine',coalesce((select jsonb_agg(jsonb_build_object('game',game,'runs',runs,
    'best',best_score,'points',total_points,'clears',clears))
     from public.community_retro_scores where user_id=uid),'[]'::jsonb),
  'trophies',coalesce((select jsonb_agg(jsonb_build_object('game',game,'trophy',trophy,'score',score))
     from public.community_retro_trophies where user_id=uid),'[]'::jsonb),
  'leaders',coalesce((select jsonb_agg(item) from (
   select jsonb_build_object('name',m.display_name,'game',s.game,
      'best',s.best_score,'runs',s.runs,'clears',s.clears) as item
   from public.community_retro_scores s
   join public.community_members m on m.user_id=s.user_id and m.status='approved'
   order by s.best_score desc limit 40
  ) leaders),'[]'::jsonb));
end;
$fn$;
revoke all on function public.community_retro_state() from public;
grant execute on function public.community_retro_state() to authenticated;
commit;
