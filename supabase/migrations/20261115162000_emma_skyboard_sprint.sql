-- Emma's Skyboard Sprint: private, per-member 30-stage board race.
-- Players cannot write scores or medals directly. Only restricted RPCs can.
begin;
create table if not exists public.community_boardride_profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 stage integer not null default 1 check(stage between 1 and 31),
 runs integer not null default 0 check(runs>=0),
 clears integer not null default 0 check(clears>=0),
 points bigint not null default 0 check(points>=0),
 coins integer not null default 0 check(coins>=0),
 best_ms integer check(best_ms between 1 and 300000),
 updated_at timestamptz not null default now()
);
create table if not exists public.community_boardride_runs(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 stage integer not null check(stage between 1 and 30),
 seed integer not null check(seed between 0 and 2000000000),
 board text not null check(board in ('sunny','snow','rocket','flower','dragon','star')),
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 status text not null default 'active' check(status in ('active','finished','abandoned')),
 elapsed_ms integer check(elapsed_ms between 1 and 300000),
 coins integer check(coins between 0 and 80),
 points integer check(points>=0)
);
create index if not exists community_boardride_recent on public.community_boardride_runs(user_id,started_at desc);
create unique index if not exists community_boardride_one_active on public.community_boardride_runs(user_id) where status='active';
create table if not exists public.community_boardride_badges(
 user_id uuid not null references auth.users(id) on delete cascade,
 badge text not null check(badge in ('first','five','ten','fifteen','twenty','finish')),
 earned_at timestamptz not null default now(),
 primary key(user_id,badge)
);
alter table public.community_boardride_profiles enable row level security;
alter table public.community_boardride_runs enable row level security;
alter table public.community_boardride_badges enable row level security;
revoke all on public.community_boardride_profiles,public.community_boardride_runs,public.community_boardride_badges from public,anon,authenticated;
create or replace function public.community_boardride_allowed()
returns uuid language plpgsql stable security definer set search_path='' as $fn$
declare v_user uuid:=auth.uid();
begin
 if v_user is null or not exists(select 1 from public.community_members m where m.user_id=v_user and m.status='approved') then
  raise exception 'Approved Family Message Board membership required' using errcode='42501';
 end if;
 return v_user;
end;
$fn$;
create or replace function public.community_boardride_state()
returns jsonb language plpgsql stable security definer set search_path='' as $fn$
declare v_user uuid;v_mine jsonb;v_leaders jsonb;v_badges jsonb;
begin
 v_user:=public.community_boardride_allowed();
 select to_jsonb(p) into v_mine from public.community_boardride_profiles p where p.user_id=v_user;
 select coalesce(jsonb_agg(to_jsonb(b) order by b.earned_at asc),'[]'::jsonb)
  into v_badges from public.community_boardride_badges b where b.user_id=v_user;
 select coalesce(jsonb_agg(to_jsonb(l)),'[]'::jsonb) into v_leaders from (
  select p.user_id,coalesce(nullif(m.display_name,''),'Family Member') as name,
   p.stage,p.points,p.clears from public.community_boardride_profiles p
  join public.community_members m on m.user_id=p.user_id and m.status='approved'
  where p.clears>0 order by p.stage desc,p.points desc,p.updated_at asc limit 20
 ) l;
 return jsonb_build_object('mine',coalesce(v_mine,jsonb_build_object('stage',1,'points',0,'coins',0,'clears',0,'runs',0)),
 'badges',v_badges,'leaders',v_leaders);
end;
$fn$;
create or replace function public.community_boardride_start(p_board text default 'sunny')
returns jsonb language plpgsql volatile security definer set search_path='' as $fn$
declare v_user uuid;v_stage integer;v_seed integer;v_run uuid;v_unlock integer;
begin
 v_user:=public.community_boardride_allowed();
 insert into public.community_boardride_profiles(user_id) values(v_user) on conflict(user_id) do nothing;
 select stage into v_stage from public.community_boardride_profiles where user_id=v_user for update;
 if v_stage>30 then raise exception 'All stages completed. Enjoy your championship!' using errcode='22023'; end if;
 v_unlock:=case p_board
  when 'sunny' then 1 when 'snow' then 4 when 'rocket' then 7
  when 'flower' then 11 when 'dragon' then 19 when 'star' then 31 else 100 end;
 if v_unlock>v_stage then raise exception 'That board is not unlocked yet' using errcode='22023';end if;
 update public.community_boardride_runs set status='abandoned',finished_at=now()
  where user_id=v_user and status='active';
 v_seed:=floor(random()*2000000000)::integer;
 insert into public.community_boardride_runs(user_id,stage,seed,board)
 values(v_user,v_stage,v_seed,p_board) returning id into v_run;
 return jsonb_build_object('run_id',v_run,'seed',v_seed,'stage',v_stage,'board',p_board);
end;
$fn$;
create or replace function public.community_boardride_finish(p_run_id uuid,p_elapsed_ms integer,p_coins integer)
returns jsonb language plpgsql volatile security definer set search_path='' as $fn$
declare v_user uuid;v_run public.community_boardride_runs%rowtype;v_profile public.community_boardride_profiles%rowtype;
 v_wall integer;v_points integer;v_new text[]:=array[]::text[];v_badge text;v_milestone record;v_next integer;
begin
 v_user:=public.community_boardride_allowed();
 if p_elapsed_ms is null or p_elapsed_ms not between 7000 and 300000 or
  p_coins is null or p_coins not between 0 and 80 then
   raise exception 'Invalid race duration or star count' using errcode='22023';
 end if;
 select * into v_run from public.community_boardride_runs
  where id=p_run_id and user_id=v_user and status='active' for update;
 if not found then raise exception 'Race already completed or not owned by this member' using errcode='42501';end if;
 v_wall:=floor(extract(epoch from(now()-v_run.started_at))*1000)::integer;
 if v_wall<6500 or p_elapsed_ms>v_wall+2500 or v_wall>1200000 then
  raise exception 'Race timing could not be validated' using errcode='22023';
 end if;
 select * into v_profile from public.community_boardride_profiles where user_id=v_user for update;
 if v_profile.stage<>v_run.stage then raise exception 'Stage progression changed during the race' using errcode='22023';end if;
 v_points:=100+v_run.stage*20+greatest(0,500-p_elapsed_ms/150)+p_coins*20;
 update public.community_boardride_runs set status='finished',finished_at=now(),
  elapsed_ms=p_elapsed_ms,coins=p_coins,points=v_points where id=v_run.id;
 v_next:=least(31,v_run.stage+1);
 update public.community_boardride_profiles set stage=v_next,runs=runs+1,clears=clears+1,
  points=points+v_points,coins=coins+p_coins,
  best_ms=least(coalesce(best_ms,300000),p_elapsed_ms),updated_at=now()
  where user_id=v_user;
 for v_milestone in select * from (values
   ('first',2),('five',6),('ten',11),('fifteen',16),('twenty',21),('finish',31)
  ) as m(badge,required) loop
  if v_next>=v_milestone.required then
   insert into public.community_boardride_badges(user_id,badge) values(v_user,v_milestone.badge)
    on conflict(user_id,badge) do nothing;
   if found then v_new:=array_append(v_new,v_milestone.badge);end if;
  end if;
 end loop;
 return jsonb_build_object('stage',v_run.stage,'next_stage',v_next,'points',v_points,
  'coins',p_coins,'new_badges',to_jsonb(v_new),'saved',true);
end;
$fn$;
revoke all on function public.community_boardride_allowed() from public,anon,authenticated;
revoke all on function public.community_boardride_state() from public,anon,authenticated;
revoke all on function public.community_boardride_start(text) from public,anon,authenticated;
revoke all on function public.community_boardride_finish(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.community_boardride_state() to authenticated;
grant execute on function public.community_boardride_start(text) to authenticated;
grant execute on function public.community_boardride_finish(uuid,integer,integer) to authenticated;
commit;
