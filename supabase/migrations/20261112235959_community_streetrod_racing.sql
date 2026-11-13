-- Street r0d Racing · original garage/drag-racing arcade for the approved Commons.
-- Multiplayer is asynchronous real-player same-seed duels. No cash gambling or purchases.
create table if not exists public.community_streetrod_garages (
 user_id uuid primary key references auth.users(id) on delete cascade,
 credits integer not null default 1200 check(credits between 0 and 100000000),
 races integer not null default 0 check(races>=0),
 wins integer not null default 0 check(wins>=0),
 duel_wins integer not null default 0 check(duel_wins>=0),
 total_points bigint not null default 0 check(total_points>=0),
 best_ms integer,
 best_reaction_ms integer,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.community_streetrod_cars (
 user_id uuid not null references auth.users(id) on delete cascade,
 car_key text not null check(car_key in ('rattler','comet','nomad','meteor','phantom')),
 engine smallint not null default 0 check(engine between 0 and 5),
 tires smallint not null default 0 check(tires between 0 and 5),
 gearbox smallint not null default 0 check(gearbox between 0 and 5),
 selected boolean not null default false,
 bought_at timestamptz not null default now(),
 primary key(user_id,car_key)
);
create unique index if not exists streetrod_one_selected_car on public.community_streetrod_cars(user_id) where selected;
create table if not exists public.community_streetrod_duels (
 id uuid primary key default gen_random_uuid(), creator uuid not null references auth.users(id) on delete cascade,
 challenger uuid references auth.users(id) on delete set null,
 seed integer not null check(seed between 1 and 999999),
 status text not null default 'open' check(status in ('open','matched','completed','cancelled')),
 winner uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), expires_at timestamptz not null default (now()+interval '24 hours'),
 completed_at timestamptz,
 check(challenger is null or challenger<>creator)
);
create index if not exists streetrod_duels_open on public.community_streetrod_duels(status,created_at desc);
create table if not exists public.community_streetrod_runs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 duel_id uuid references public.community_streetrod_duels(id) on delete set null,
 mode text not null check(mode in ('solo','duel')),
 car_key text not null,
 engine smallint not null, tires smallint not null, gearbox smallint not null,
 seed integer not null,
 status text not null default 'active' check(status in ('active','finished','abandoned','expired')),
 started_at timestamptz not null default now(), finished_at timestamptz,
 reaction_ms integer, et_ms integer, total_ms integer, points integer, credits_earned integer,
 won boolean,
 shifts integer[], nitro_ms integer,
 unique(user_id,duel_id),
 check(mode='duel' or duel_id is null)
);
create index if not exists streetrod_runs_scores on public.community_streetrod_runs(status,total_ms) where status='finished';
create index if not exists streetrod_runs_user on public.community_streetrod_runs(user_id,started_at desc);
create table if not exists public.community_streetrod_badges (
 user_id uuid not null references auth.users(id) on delete cascade,
 code text not null,
 unlocked_at timestamptz not null default now(),
 primary key(user_id,code)
);

alter table public.community_streetrod_garages enable row level security;
alter table public.community_streetrod_cars enable row level security;
alter table public.community_streetrod_duels enable row level security;
alter table public.community_streetrod_runs enable row level security;
alter table public.community_streetrod_badges enable row level security;
revoke all on public.community_streetrod_garages,public.community_streetrod_cars,
 public.community_streetrod_duels,public.community_streetrod_runs,
 public.community_streetrod_badges from public,anon,authenticated;

create or replace function public.community_streetrod_member()
returns uuid language plpgsql security definer set search_path to 'pg_catalog','public' as $$
declare u uuid:=auth.uid();
begin
 if u is null or not exists(select 1 from public.community_members where user_id=u and status='approved') then
 raise exception 'Approved Commons membership required' using errcode='42501'; end if;
 return u;
end $$;
revoke all on function public.community_streetrod_member() from public,anon,authenticated;

create or replace function public.community_streetrod_catalog()
returns jsonb language sql immutable set search_path to 'pg_catalog','public' as $$
select jsonb_build_array(
 jsonb_build_object('key','rattler','name','Rattler 48','class','Street starter','price',0,'base',14400,'power',2,'grip',2,'accent','#ebbb58'),
 jsonb_build_object('key','comet','name','Comet 55','class','Lightweight coupe','price',1600,'base',13300,'power',4,'grip',3,'accent','#61d8cf'),
 jsonb_build_object('key','nomad','name','Nomad 63','class','Garage sleeper','price',3900,'base',12300,'power',5,'grip',4,'accent','#b28bfa'),
 jsonb_build_object('key','meteor','name','Meteor 67','class','Muscle bruiser','price',7800,'base',11200,'power',7,'grip',5,'accent','#ff7a78'),
 jsonb_build_object('key','phantom','name','Phantom X','class','Endgame street legend','price',17500,'base',10300,'power',9,'grip',7,'accent','#f4ca5d')
);
$$;
revoke all on function public.community_streetrod_catalog() from public,anon;
grant execute on function public.community_streetrod_catalog() to authenticated;

create or replace function public.community_streetrod_unlock(p_user uuid)
returns void language plpgsql security definer set search_path to 'pg_catalog','public' as $$
declare g public.community_streetrod_garages%rowtype; owned integer; maxed integer; fast integer;
begin
 select * into g from public.community_streetrod_garages where user_id=p_user;
 select count(*),count(*) filter(where engine=5 and tires=5 and gearbox=5) into owned,maxed from public.community_streetrod_cars where user_id=p_user;
 select count(*) into fast from public.community_streetrod_runs where user_id=p_user and status='finished' and total_ms<11000;
 insert into public.community_streetrod_badges(user_id,code)
 select p_user,c from (values
 ('first_key',g.races>=1),('first_win',g.wins>=1),('night_shift',g.races>=5),
 ('ten_races',g.races>=10),('fifty_races',g.races>=50),('hundred_races',g.races>=100),
 ('eleven_second',fast>=1),('street_champion',g.wins>=20),('rival_slayer',g.duel_wins>=1),
 ('rival_king',g.duel_wins>=10),('collector',owned>=3),('full_build',maxed>=1),
 ('credit_millionaire',g.credits>=100000),('six_figures',g.total_points>=100000)
 ) as x(c,qualifies) where qualifies
 on conflict do nothing;
end $$;
revoke all on function public.community_streetrod_unlock(uuid) from public,anon,authenticated;

create or replace function public.community_streetrod_state()
returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public' as $$
declare u uuid:=public.community_streetrod_member(); g public.community_streetrod_garages%rowtype;
begin
 insert into public.community_streetrod_garages(user_id) values(u) on conflict do nothing;
 insert into public.community_streetrod_cars(user_id,car_key,selected) values(u,'rattler',true) on conflict do nothing;
 select * into g from public.community_streetrod_garages where user_id=u;
 return jsonb_build_object(
 'garage',jsonb_build_object('credits',g.credits,'races',g.races,'wins',g.wins,'duel_wins',g.duel_wins,'points',g.total_points,'best_ms',g.best_ms,'best_reaction_ms',g.best_reaction_ms),
 'catalog',public.community_streetrod_catalog(),
 'cars',coalesce((select jsonb_agg(jsonb_build_object('key',car_key,'engine',engine,'tires',tires,'gearbox',gearbox,'selected',selected) order by bought_at) from public.community_streetrod_cars where user_id=u),'[]'::jsonb),
 'badges',coalesce((select jsonb_agg(code order by unlocked_at) from public.community_streetrod_badges where user_id=u),'[]'::jsonb),
 'leaders',coalesce((select jsonb_agg(item order by best_ms nulls last) from (
  select jsonb_build_object('name',m.display_name,'best_ms',gg.best_ms,'points',gg.total_points,'wins',gg.wins,'duel_wins',gg.duel_wins) item,gg.best_ms
  from public.community_streetrod_garages gg join public.community_members m on m.user_id=gg.user_id
  where m.status='approved' and gg.best_ms is not null order by gg.best_ms limit 12) r),'[]'::jsonb),
 'recent',coalesce((select jsonb_agg(jsonb_build_object('mode',mode,'total_ms',total_ms,'points',points,'won',won,'created_at',finished_at,'car',car_key) order by finished_at desc)
   from (select mode,total_ms,points,won,finished_at,car_key from public.community_streetrod_runs where user_id=u and status='finished' order by finished_at desc limit 10) r),'[]'::jsonb),
 'duels',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'seed',d.seed,'status',d.status,'creator',m.display_name,'creator_id',d.creator,'challenger_id',d.challenger,'mine',d.creator=u or d.challenger=u,'winner_id',d.winner,
 'creator_ms',(select r.total_ms from public.community_streetrod_runs r where r.duel_id=d.id and r.user_id=d.creator and r.status='finished' limit 1),
 'challenger_ms',(select r.total_ms from public.community_streetrod_runs r where r.duel_id=d.id and r.user_id=d.challenger and r.status='finished' limit 1)) order by d.created_at desc)
  from (select * from public.community_streetrod_duels where (status='open' and expires_at>now()) or (status in ('matched','completed') and (creator=u or challenger=u) and created_at>now()-interval '7 days') order by created_at desc limit 16) d
  join public.community_members m on m.user_id=d.creator and m.status='approved'),'[]'::jsonb),
 'active', (select jsonb_build_object('id',id,'mode',mode,'seed',seed,'car',car_key,'engine',engine,'tires',tires,'gearbox',gearbox,'duel_id',duel_id,'started_at',started_at)
    from public.community_streetrod_runs where user_id=u and status='active' and started_at>now()-interval '3 minutes' order by started_at desc limit 1)
 );
end $$;

create or replace function public.community_streetrod_buy(p_item text)
returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public' as $$
declare u uuid:=public.community_streetrod_member(); g public.community_streetrod_garages%rowtype;
 v_item text:=lower(trim(coalesce(p_item,''))); v_car text; v_type text; v_lvl smallint; v_price integer; v_present boolean;
begin
 perform public.community_streetrod_state();
 select * into g from public.community_streetrod_garages where user_id=u for update;
 if left(v_item,4)='car:' then
  v_car:=substring(v_item from 5);
  select (car->>'price')::int into v_price from jsonb_array_elements(public.community_streetrod_catalog()) car where car->>'key'=v_car;
  if v_price is null or v_price=0 then raise exception 'Unknown car' using errcode='22023'; end if;
  if exists(select 1 from public.community_streetrod_cars where user_id=u and car_key=v_car) then raise exception 'Already in your garage' using errcode='22023';end if;
  if g.credits<v_price then raise exception 'Not enough race credits' using errcode='22023';end if;
  update public.community_streetrod_garages set credits=credits-v_price,updated_at=now() where user_id=u;
  insert into public.community_streetrod_cars(user_id,car_key) values(u,v_car);
 elsif v_item in ('engine','tires','gearbox') then
  select c.car_key into v_car from public.community_streetrod_cars c where c.user_id=u and c.selected for update;
  if v_car is null then raise exception 'Choose a car first' using errcode='22023';end if;
  if v_item='engine' then select engine into v_lvl from public.community_streetrod_cars where user_id=u and car_key=v_car;
  elsif v_item='tires' then select tires into v_lvl from public.community_streetrod_cars where user_id=u and car_key=v_car;
  else select gearbox into v_lvl from public.community_streetrod_cars where user_id=u and car_key=v_car;end if;
  if v_lvl>=5 then raise exception 'Already maxed out' using errcode='22023';end if;
  v_price:=250+v_lvl*250+(case when v_item='engine' then 100 when v_item='gearbox' then 50 else 0 end);
  if g.credits<v_price then raise exception 'Not enough race credits' using errcode='22023';end if;
  update public.community_streetrod_garages set credits=credits-v_price,updated_at=now() where user_id=u;
  if v_item='engine' then update public.community_streetrod_cars set engine=engine+1 where user_id=u and car_key=v_car;
  elsif v_item='tires' then update public.community_streetrod_cars set tires=tires+1 where user_id=u and car_key=v_car;
  else update public.community_streetrod_cars set gearbox=gearbox+1 where user_id=u and car_key=v_car;end if;
 else raise exception 'Unknown garage item' using errcode='22023';end if;
 perform public.community_streetrod_unlock(u);
 return public.community_streetrod_state();
end $$;

create or replace function public.community_streetrod_select(p_car text)
returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public' as $$
declare u uuid:=public.community_streetrod_member();
begin
 if not exists(select 1 from public.community_streetrod_cars where user_id=u and car_key=p_car) then raise exception 'Car not in your garage' using errcode='22023';end if;
 update public.community_streetrod_cars set selected=false where user_id=u and selected=true;
 update public.community_streetrod_cars set selected=true where user_id=u and car_key=p_car;
 return public.community_streetrod_state();
end $$;

create or replace function public.community_streetrod_start(p_mode text,p_duel_id uuid default null)
returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public' as $$
declare u uuid:=public.community_streetrod_member(); c public.community_streetrod_cars%rowtype;
 d public.community_streetrod_duels%rowtype; v_id uuid; v_seed integer; started timestamptz;
begin
 perform public.community_streetrod_state();
 if p_mode not in ('solo','duel') then raise exception 'Choose solo or duel' using errcode='22023';end if;
 if exists(select 1 from public.community_streetrod_runs where user_id=u and status='active' and started_at>now()-interval '3 minutes') then raise exception 'Finish or abandon your active race first' using errcode='22023';end if;
 update public.community_streetrod_runs set status='expired' where user_id=u and status='active' and started_at<=now()-interval '3 minutes';
 select * into c from public.community_streetrod_cars where user_id=u and selected;
 if c.user_id is null then raise exception 'Select a car before racing' using errcode='22023';end if;
 if p_mode='duel' then
  if p_duel_id is null then
   if (select count(*) from public.community_streetrod_duels where creator=u and status='open' and expires_at>now())>=3 then raise exception 'You have three open challenges already' using errcode='22023';end if;
   v_seed:=1+floor(random()*999998)::int;
   insert into public.community_streetrod_duels(creator,seed) values(u,v_seed) returning * into d;
  else
   select * into d from public.community_streetrod_duels where id=p_duel_id for update;
   if d.id is null or d.status<>'open' or d.expires_at<=now() or d.creator=u then raise exception 'Challenge unavailable' using errcode='22023';end if;
   d.challenger:=u;
   update public.community_streetrod_duels set challenger=u,status='matched' where id=d.id;
  end if;
  v_seed:=d.seed;
 else
  v_seed:=1+floor(random()*999998)::int;
 end if;
 insert into public.community_streetrod_runs(user_id,duel_id,mode,car_key,engine,tires,gearbox,seed)
 values(u,d.id,p_mode,c.car_key,c.engine,c.tires,c.gearbox,v_seed)
 returning id,started_at into v_id,started;
 return jsonb_build_object('id',v_id,'mode',p_mode,'seed',v_seed,'car',c.car_key,'engine',c.engine,'tires',c.tires,'gearbox',c.gearbox,'duel_id',d.id,'started_at',started);
end $$;

create or replace function public.community_streetrod_abandon(p_run_id uuid)
returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public' as $$
declare u uuid:=public.community_streetrod_member();
begin
 update public.community_streetrod_runs set status='abandoned' where id=p_run_id and user_id=u and status='active';
 return public.community_streetrod_state();
end $$;

create or replace function public.community_streetrod_finish(p_run_id uuid,p_launch_ms integer,p_shifts integer[],p_nitro_ms integer default null)
returns jsonb language plpgsql security definer set search_path to 'pg_catalog','public' as $$
declare u uuid:=public.community_streetrod_member(); r public.community_streetrod_runs%rowtype;
 d public.community_streetrod_duels%rowtype; p_total int; p_et int; p_base int; p_penalty int;
 v_ai int; v_win boolean; v_points int; v_credits int; v_other int; v_winner uuid;
 v_delta int; ideals int[]:=array[2100,4500,6900]; i integer;
begin
 select * into r from public.community_streetrod_runs where id=p_run_id and user_id=u for update;
 if r.id is null or r.status<>'active' then raise exception 'Race is no longer active' using errcode='22023';end if;
 if r.started_at<now()-interval '3 minutes' then update public.community_streetrod_runs set status='expired' where id=r.id;raise exception 'Race expired. Start another.' using errcode='22023';end if;
 if now()<r.started_at+interval '12 seconds' then raise exception 'Race is still running' using errcode='22023';end if;
 if p_launch_ms is null or p_launch_ms<0 or p_launch_ms>1800 or
    array_length(p_shifts,1)<>3 or p_shifts[1] is null or p_shifts[2] is null or p_shifts[3] is null or
    p_shifts[1]<500 or p_shifts[1]>=p_shifts[2] or p_shifts[2]>=p_shifts[3] or p_shifts[3]>11500 or
    (p_nitro_ms is not null and (p_nitro_ms<1500 or p_nitro_ms>11000)) then
    raise exception 'Invalid race controls' using errcode='22023';end if;
 select (car->>'base')::integer into p_base from jsonb_array_elements(public.community_streetrod_catalog()) car where car->>'key'=r.car_key;
 if p_base is null then raise exception 'Car unavailable';end if;
 p_penalty:=0;
 for i in 1..3 loop
   v_delta:=abs(p_shifts[i]-(ideals[i]+(r.seed%7-3)*45));
   p_penalty:=p_penalty+greatest(0,v_delta-200)/7;
 end loop;
 p_et:=greatest(8500,p_base - r.engine*360-r.tires*210-r.gearbox*270 + (r.seed%13-6)*27 +p_penalty -case when p_nitro_ms between 3300 and 8500 then 350 when p_nitro_ms is not null then 160 else 0 end);
 p_total:=p_et+greatest(120,p_launch_ms);
 v_ai:=13300 + (r.seed%19-9)*75 - case when r.car_key in ('meteor','phantom') then 600 else 0 end;
 v_win:=case when r.mode='solo' then p_total<v_ai else false end;
 v_points:=greatest(60,round((19000-p_total)::numeric/8)::int + case when v_win then 300 else 0 end);
 v_credits:=120+floor(v_points::numeric/3)::int + case when v_win then 260 else 0 end;
 update public.community_streetrod_runs set status='finished',finished_at=now(),reaction_ms=p_launch_ms,et_ms=p_et,total_ms=p_total,
   points=v_points,credits_earned=v_credits,won=case when mode='solo' then v_win else null end,shifts=p_shifts,nitro_ms=p_nitro_ms where id=r.id;
 update public.community_streetrod_garages set races=races+1, wins=wins+case when v_win then 1 else 0 end,
  total_points=total_points+v_points,credits=least(100000000,credits+v_credits),best_ms=least(coalesce(best_ms,p_total),p_total),
  best_reaction_ms=least(coalesce(best_reaction_ms,p_launch_ms),p_launch_ms),updated_at=now() where user_id=u;
 if r.mode='duel' then
  select * into d from public.community_streetrod_duels where id=r.duel_id for update;
  if d.id is not null and d.status in ('open','matched') and d.challenger is not null then
    select total_ms into v_other from public.community_streetrod_runs
      where duel_id=d.id and user_id<>u and status='finished' limit 1;
    if v_other is not null then
      v_winner:=case when p_total<v_other then u when p_total=v_other then null else (case when d.creator=u then d.challenger else d.creator end) end;
      -- The race winner's profile is updated once, when the second driver finishes.
      update public.community_streetrod_duels set winner=v_winner,status='completed',completed_at=now() where id=d.id and status<>'completed';
      update public.community_streetrod_runs set won=(user_id=v_winner) where duel_id=d.id and status='finished';
      if v_winner is not null then
        update public.community_streetrod_garages set wins=wins+1,duel_wins=duel_wins+1,
         total_points=total_points+500,credits=least(100000000,credits+350),updated_at=now() where user_id=v_winner;
        perform public.community_streetrod_unlock(v_winner);
      end if;
    end if;
  end if;
 end if;
 perform public.community_streetrod_unlock(u);
 return jsonb_build_object('run_id',r.id,'et_ms',p_et,'total_ms',p_total,'reaction_ms',p_launch_ms,'points',v_points,'credits_earned',v_credits,
 'opponent_ms',case when r.mode='solo' then v_ai else v_other end,'win',case when r.mode='solo' then v_win when v_other is null then null else p_total<v_other end,
 'mode',r.mode,'state',public.community_streetrod_state());
end $$;

-- Explicit RPC-only access: all underlying rows remain RLS-protected and ungranted.
revoke all on function public.community_streetrod_state(),public.community_streetrod_buy(text),public.community_streetrod_select(text),
 public.community_streetrod_start(text,uuid),public.community_streetrod_abandon(uuid),
 public.community_streetrod_finish(uuid,integer,integer[],integer) from public,anon;
grant execute on function public.community_streetrod_state(),public.community_streetrod_buy(text),public.community_streetrod_select(text),
 public.community_streetrod_start(text,uuid),public.community_streetrod_abandon(uuid),
 public.community_streetrod_finish(uuid,integer,integer[],integer) to authenticated;
