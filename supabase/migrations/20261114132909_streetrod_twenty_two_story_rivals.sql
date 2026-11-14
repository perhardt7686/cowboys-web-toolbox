-- Use the provider migration history version 20261114132909; production applied and verified.
-- The partial PGlite CI seed does not contain the private seasonal schema.
-- Guard the complete update. When tables exist, all four functions are updated.
DO $streetrod_rival_migration$
BEGIN
 IF to_regclass('public.community_streetrod_seasons') IS NOT NULL
 AND to_regclass('public.community_streetrod_season_races') IS NOT NULL
 AND to_regclass('public.community_streetrod_season_cars') IS NOT NULL THEN
  EXECUTE $rival_ddl_0$
CREATE OR REPLACE FUNCTION public.community_streetrod_season_rivals()
RETURNS jsonb LANGUAGE sql IMMUTABLE SECURITY INVOKER
SET search_path TO 'pg_catalog','public'
AS $rivals$
SELECT jsonb_build_array(
 jsonb_build_object('key','rookie','name','Juniper Jack','car','Rattler 48','tier',0,'require',0,'rep',0,'drag_ms',17500,'road_ms',149000,'reward',85,'pink_car','dustline32','symbol','J'),
 jsonb_build_object('key','rusty_rita','name','Rusty Rita','car','Duchess 41','tier',0,'require',0,'rep',0,'drag_ms',17100,'road_ms',146000,'reward',90,'pink_car','duchess41','symbol','R'),
 jsonb_build_object('key','hangar_hank','name','Hangar Hank','car','Wren 49','tier',0,'require',0,'rep',0,'drag_ms',16900,'road_ms',143000,'reward',95,'pink_car','wren49','symbol','H'),
 jsonb_build_object('key','cruiser','name','Neon Nora','car','Comet 55','tier',1,'require',1,'rep',0,'drag_ms',15500,'road_ms',135000,'reward',150,'pink_car','comet','symbol','N'),
 jsonb_build_object('key','clutch_cleo','name','Clutch Cleo','car','Brookline 60','tier',1,'require',1,'rep',0,'drag_ms',15350,'road_ms',132500,'reward',155,'pink_car','brookline60','symbol','C'),
 jsonb_build_object('key','camshaft_cal','name','Camshaft Cal','car','Saturn 58','tier',1,'require',1,'rep',0,'drag_ms',15200,'road_ms',130000,'reward',165,'pink_car','saturn58','symbol','C'),
 jsonb_build_object('key','grease_gus','name','Grease Gus','car','Dustline 32','tier',2,'require',2,'rep',0,'drag_ms',14850,'road_ms',128000,'reward',180,'pink_car','dustline32','symbol','G'),
 jsonb_build_object('key','lola_lugs','name','Lola Lugs','car','Nomad 63','tier',2,'require',2,'rep',0,'drag_ms',14650,'road_ms',126000,'reward',190,'pink_car','nomad','symbol','L'),
 jsonb_build_object('key','weld_wes','name','Weld Wes','car','Oldirons 49','tier',2,'require',2,'rep',0,'drag_ms',14400,'road_ms',124500,'reward',195,'pink_car','oldirons49','symbol','W'),
 jsonb_build_object('key','hotshot','name','Redline Ray','car','Nomad 63','tier',3,'require',3,'rep',0,'drag_ms',13600,'road_ms',121000,'reward',250,'pink_car','nomad','symbol','R'),
 jsonb_build_object('key','torque_tina','name','Torque Tina','car','Comet 55','tier',3,'require',3,'rep',0,'drag_ms',13500,'road_ms',119500,'reward',255,'pink_car','comet','symbol','T'),
 jsonb_build_object('key','slick_vic','name','Slick Vic','car','Brookline 60','tier',3,'require',3,'rep',0,'drag_ms',13300,'road_ms',118000,'reward',265,'pink_car','brookline60','symbol','S'),
 jsonb_build_object('key','iron_ivy','name','Iron Ivy','car','Gravelking 57','tier',4,'require',4,'rep',0,'drag_ms',13000,'road_ms',116500,'reward',290,'pink_car','gravelking57','symbol','I'),
 jsonb_build_object('key','buster_bolt','name','Buster Bolt','car','Saturn 58','tier',4,'require',4,'rep',0,'drag_ms',12850,'road_ms',115000,'reward',310,'pink_car','saturn58','symbol','B'),
 jsonb_build_object('key','ace_avery','name','Ace Avery','car','Nomad 63','tier',4,'require',4,'rep',0,'drag_ms',12750,'road_ms',114000,'reward',320,'pink_car','nomad','symbol','A'),
 jsonb_build_object('key','nitro_nell','name','Nitro Nell','car','Comet 55','tier',5,'require',5,'rep',0,'drag_ms',12500,'road_ms',113000,'reward',355,'pink_car','comet','symbol','N'),
 jsonb_build_object('key','max_motor','name','Max Motor','car','Oldirons 49','tier',5,'require',5,'rep',0,'drag_ms',12400,'road_ms',112000,'reward',370,'pink_car','oldirons49','symbol','M'),
 jsonb_build_object('key','midnight_mara','name','Midnight Mara','car','Dustline 32','tier',5,'require',5,'rep',0,'drag_ms',12300,'road_ms',111000,'reward',390,'pink_car','dustline32','symbol','M'),
 jsonb_build_object('key','turbo_tess','name','Turbo Tess','car','Nomad 63','tier',6,'require',6,'rep',5,'drag_ms',12000,'road_ms',110500,'reward',420,'pink_car','nomad','symbol','T'),
 jsonb_build_object('key','phantom_pete','name','Phantom Pete','car','Saturn 58','tier',6,'require',6,'rep',5,'drag_ms',11800,'road_ms',109500,'reward',450,'pink_car','saturn58','symbol','P'),
 jsonb_build_object('key','wrench_wendy','name','Wrench Wendy','car','Brookline 60','tier',6,'require',6,'rep',6,'drag_ms',11650,'road_ms',109000,'reward',480,'pink_car','brookline60','symbol','W'),
 jsonb_build_object('key','cipher','name','The Mystery Machine','car','Turquoise flower-power mystery van','tier',7,'require',6,'rep',7,'drag_ms',11500,'road_ms',108000,'reward',600,'pink_car','phantom','symbol','★')
);
$rivals$;
$rival_ddl_0$;
  EXECUTE $rival_ddl_1$
REVOKE ALL ON FUNCTION public.community_streetrod_season_rivals() FROM PUBLIC;
$rival_ddl_1$;
  EXECUTE $rival_ddl_2$
REVOKE EXECUTE ON FUNCTION public.community_streetrod_season_rivals() FROM anon;
$rival_ddl_2$;
  EXECUTE $rival_ddl_3$
GRANT EXECUTE ON FUNCTION public.community_streetrod_season_rivals() TO authenticated;
$rival_ddl_3$;
  EXECUTE $rival_ddl_4$
CREATE OR REPLACE FUNCTION public.community_streetrod_season_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare u uuid:=public.community_streetrod_member(); s public.community_streetrod_seasons%rowtype;
begin
 insert into public.community_streetrod_seasons(user_id,current_car)
 values(u,'rattler') on conflict do nothing;
 if found then
   insert into public.community_streetrod_season_cars(user_id,car_key,acquired_day,paint)
   values(u,'rattler',1,'#a45634') on conflict do nothing;
 end if;
 select * into s from public.community_streetrod_seasons where user_id=u;
 return jsonb_build_object(
   'season',to_jsonb(s)-'user_id',
   'garage',coalesce((select jsonb_agg(to_jsonb(c)-'user_id' order by acquired_day,car_key)
          from public.community_streetrod_season_cars c where c.user_id=u),'[]'::jsonb),
   'parts',coalesce((select jsonb_agg(to_jsonb(p)-'user_id' order by id)
          from public.community_streetrod_season_parts p where p.user_id=u and p.installed_to is null),'[]'::jsonb),
   'rivals',public.community_streetrod_season_rivals(),
   'catalog',coalesce((select jsonb_agg(x order by (x->>'year')::int, x->>'name')
     from jsonb_array_elements(public.community_streetrod_catalog()) x
     where (x->>'year')~'^[0-9]{4}$' and (x->>'year')::int<=1963
       and coalesce((x->>'price')::int,0)>0),'[]'::jsonb),
   'history',coalesce((select jsonb_agg(to_jsonb(h)-'user_id' order by h.id desc)
      from (select * from public.community_streetrod_season_history
             where user_id=u order by id desc limit 18) h),'[]'::jsonb),
   'awards',coalesce((select jsonb_agg(code order by earned_at) from
      public.community_streetrod_season_awards where user_id=u),'[]'::jsonb),
   'active_run',(select to_jsonb(r)-'user_id' from public.community_streetrod_season_races r
      where r.user_id=u and r.status='active' order by started_at desc limit 1)
 );
end $function$;
$rival_ddl_4$;
  EXECUTE $rival_ddl_5$
CREATE OR REPLACE FUNCTION public.community_streetrod_season_race_start(p_rival text, p_type text, p_stake text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE u uuid:=public.community_streetrod_member(); s public.community_streetrod_seasons%rowtype; c public.community_streetrod_season_cars%rowtype;
r public.community_streetrod_season_races%rowtype;
BEGIN
 PERFORM public.community_streetrod_season_state();
 SELECT * INTO s FROM public.community_streetrod_seasons WHERE user_id=u FOR UPDATE;
 IF s.status<>'active' THEN RAISE EXCEPTION 'Season ended' USING errcode='22023'; END IF;
 IF s.service<>'{}'::jsonb THEN RAISE EXCEPTION 'Finish garage service first' USING errcode='22023'; END IF;
 SELECT * INTO c FROM public.community_streetrod_season_cars WHERE user_id=u AND car_key=s.current_car;
 IF c.user_id IS NULL OR c.fuel<15 OR c.condition<25 THEN RAISE EXCEPTION 'Need a roadworthy selected car with fuel' USING errcode='22023'; END IF;
 IF EXISTS(SELECT 1 FROM public.community_streetrod_season_workbench w WHERE w.user_id=u AND w.car_key=s.current_car
    AND NOT public.community_streetrod_season_parts_ready(w.parts)) THEN
     RAISE EXCEPTION 'Reassemble engine, gearbox, wheels and all fasteners before racing' USING errcode='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.community_streetrod_season_rivals()) x WHERE x->>'key'=p_rival) OR p_type NOT IN ('drag','road')
  OR p_stake NOT IN ('practice','25','100','title') THEN RAISE EXCEPTION 'Invalid race setup' USING errcode='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.community_streetrod_season_rivals()) x
  WHERE x->>'key'=p_rival AND s.victories >= (x->>'require')::integer
  AND s.rep >= (x->>'rep')::integer) THEN
  RAISE EXCEPTION 'Beat lower-ranked racers to unlock this challenge' USING errcode='22023';END IF;
 IF p_stake IN ('25','100') AND s.cash < p_stake::integer THEN
  RAISE EXCEPTION 'Insufficient seasonal cash' USING errcode='22023'; END IF;
 IF p_stake='title' AND (p_type<>'road' OR s.victories<3) THEN
  RAISE EXCEPTION 'Title wagers require a road race and three wins' USING errcode='22023';END IF;
 IF EXISTS(SELECT 1 FROM public.community_streetrod_season_races WHERE user_id=u AND status='active') THEN
  RAISE EXCEPTION 'Finish or abandon the active race' USING errcode='22023';END IF;
 INSERT INTO public.community_streetrod_season_races(user_id,season_no,car_key,rival,race_type,stake,seed)
 VALUES(u,s.season_no,c.car_key,p_rival,p_type,p_stake,10000+floor(random()*899999)::integer) RETURNING * INTO r;
 RETURN jsonb_build_object('id',r.id,'started_at',r.started_at,'seed',r.seed,
  'rival',r.rival,'type',r.race_type,'stake',r.stake,'car',r.car_key);
END;
$function$;
$rival_ddl_5$;
  EXECUTE $rival_ddl_6$
CREATE OR REPLACE FUNCTION public.community_streetrod_season_race_finish(p_run uuid, p_launch_ms integer, p_shifts integer[], p_trace jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
 u uuid:=public.community_streetrod_member();
 r public.community_streetrod_season_races%rowtype;
 s public.community_streetrod_seasons%rowtype;
 car public.community_streetrod_season_cars%rowtype;
 entry jsonb;
 t integer;last_t integer:=-1;steer numeric;gas numeric;brake numeric;
 idx integer:=0;mistake numeric:=0;
 sim jsonb;seconds integer;enemy integer;damage integer;earned integer:=0; rival_data jsonb;
 won boolean;days integer;other_car text;receipt jsonb;
BEGIN
 SELECT * INTO r FROM public.community_streetrod_season_races
  WHERE id=p_run AND user_id=u FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Race not found' USING errcode='22023';END IF;
 IF r.status='finished' THEN RETURN r.detail;END IF;
 IF r.status<>'active' THEN RAISE EXCEPTION 'Race already abandoned' USING errcode='22023';END IF;
 IF now()<r.started_at+(CASE WHEN r.race_type='road' THEN interval '45 seconds' ELSE interval '12 seconds' END) THEN
  RAISE EXCEPTION 'Race has not reached the finish' USING errcode='22023';END IF;
 IF p_launch_ms IS NULL OR p_launch_ms<0 OR p_launch_ms>120000
  OR array_length(p_shifts,1)<>3 OR p_shifts[1] NOT BETWEEN 500 AND 300000
  OR p_shifts[2]<=p_shifts[1] OR p_shifts[3]<=p_shifts[2] OR p_shifts[3]>300000 THEN
  RAISE EXCEPTION 'Invalid launch or shift inputs' USING errcode='22023';END IF;
 IF p_trace IS NULL OR jsonb_typeof(p_trace)<>'array' THEN
  RAISE EXCEPTION 'Driving inputs missing' USING errcode='22023';END IF;
 IF jsonb_array_length(p_trace)<(CASE WHEN r.race_type='road' THEN 30 ELSE 8 END)
    OR jsonb_array_length(p_trace)>240 THEN
  RAISE EXCEPTION 'Driving trace is incomplete' USING errcode='22023';END IF;
 FOR entry IN SELECT value FROM jsonb_array_elements(p_trace) LOOP
  IF coalesce(entry->>'t','') !~ '^[0-9]{1,6}$'
   OR coalesce(entry->>'steer','') !~ '^-?([01](\.[0-9]{1,3})?)$'
   OR coalesce(entry->>'gas','') !~ '^([01](\.[0-9]{1,3})?)$'
   OR coalesce(entry->>'brake','') !~ '^([01](\.[0-9]{1,3})?)$' THEN
    RAISE EXCEPTION 'Invalid control sample' USING errcode='22023';END IF;
  t:=(entry->>'t')::integer;steer:=(entry->>'steer')::numeric;
  gas:=(entry->>'gas')::numeric;brake:=(entry->>'brake')::numeric;
  IF t<=last_t OR t>300000 OR (last_t>=0 AND t-last_t>3500)
     OR steer< -1 OR steer>1 OR gas<0 OR gas>1 OR brake<0 OR brake>1 THEN
    RAISE EXCEPTION 'Invalid driving sequence' USING errcode='22023';END IF;
  last_t:=t;idx:=idx+1;
  IF r.race_type='road' THEN
    mistake:=mistake+abs(sin((idx+r.seed%17)*0.46)*0.78-steer)
      *(CASE WHEN gas>0.8 THEN 1.25 ELSE 1 END);
  ELSE
    mistake:=mistake+abs(steer)*0.2+brake*0.5;
  END IF;
 END LOOP;
 IF last_t<(CASE WHEN r.race_type='road' THEN 42000 ELSE 9500 END) THEN
  RAISE EXCEPTION 'Driving trace ended too early' USING errcode='22023';END IF;
 SELECT x INTO rival_data FROM jsonb_array_elements(public.community_streetrod_season_rivals()) x
   WHERE x->>'key'=r.rival;
 IF rival_data IS NULL THEN RAISE EXCEPTION 'Unknown historic race rival' USING errcode='22023';END IF;
 SELECT * INTO s FROM public.community_streetrod_seasons WHERE user_id=u FOR UPDATE;
 SELECT * INTO car FROM public.community_streetrod_season_cars
  WHERE user_id=u AND car_key=r.car_key FOR UPDATE;
 IF car.user_id IS NULL THEN RAISE EXCEPTION 'Race car ownership not found' USING errcode='22023';END IF;
 sim:=public.community_streetrod_simulate(r.car_key,car.engine,car.tires,car.gearbox,
 r.seed,p_launch_ms,p_shifts,NULL,
 jsonb_build_object('launch_rpm',3200,'final_drive',3.75-car.tune::numeric/10,'tire_pressure',27,'shift_rpm',6400));
 damage:=least(65,round(mistake*0.28)::integer+(CASE WHEN car.bumpers THEN 0 ELSE 5 END));
 IF r.race_type='road' THEN
  seconds:=100000+greatest(-12000,((sim->>'total_ms')::integer-12000)*2)
    +least(18000,round(mistake*175)::integer)+(100-car.condition)*55
    -greatest(0,car.tune)*550;
  enemy:=(rival_data->>'road_ms')::integer+(r.seed%21-10)*180;
  days:=2;
 ELSE
  seconds:=(sim->>'total_ms')::integer+least(18000,round(mistake*175)::integer)
      +(100-car.condition)*21;
  enemy:=(rival_data->>'drag_ms')::integer+(r.seed%21-10)*61;
  days:=1;
 END IF;
 won:=seconds<enemy AND damage<52;
 IF r.stake<>'practice' THEN
  IF won THEN
   earned:=(rival_data->>'reward')::integer
     +(CASE WHEN r.stake='title' THEN 0 ELSE r.stake::integer END);
  ELSIF r.stake<>'title' THEN earned:= -r.stake::integer;
  END IF;
 END IF;
 UPDATE public.community_streetrod_season_cars SET
  fuel=greatest(0,fuel-(CASE WHEN r.race_type='road' THEN 18 ELSE 7 END)),
  condition=greatest(0,condition-damage-1)
 WHERE user_id=u AND car_key=r.car_key;
 IF r.stake='title' THEN
  other_car:=rival_data->>'pink_car';
  IF won AND r.rival<>'cipher' THEN
   INSERT INTO public.community_streetrod_season_cars(user_id,car_key,acquired_day)
    VALUES(u,other_car,s.day_no) ON CONFLICT DO NOTHING;
  ELSIF NOT won THEN
   DELETE FROM public.community_streetrod_season_cars WHERE user_id=u AND car_key=r.car_key;
   UPDATE public.community_streetrod_seasons SET current_car=
     (SELECT car_key FROM public.community_streetrod_season_cars WHERE user_id=u ORDER BY acquired_day LIMIT 1)
    WHERE user_id=u;
  END IF;
 END IF;
 UPDATE public.community_streetrod_seasons SET cash=greatest(0,least(100000000,cash+earned)),
  day_no=least(999,day_no+days),victories=victories+(CASE WHEN won AND r.stake<>'practice' THEN 1 ELSE 0 END),
  defeats=defeats+(CASE WHEN won OR r.stake='practice' THEN 0 ELSE 1 END),
  rep=rep+(CASE WHEN won AND r.stake<>'practice' THEN 1 ELSE 0 END),
  status=(CASE WHEN r.rival='cipher' AND won THEN 'champion'
      WHEN day_no+days>84 THEN 'time_up' ELSE status END),
  updated_at=now() WHERE user_id=u;
 IF r.rival='cipher' AND won THEN
  INSERT INTO public.community_streetrod_season_awards(user_id,code,season_no)
   VALUES(u,'summer_63_champion',s.season_no) ON CONFLICT DO NOTHING;
 END IF;
 receipt:=jsonb_build_object('id',r.id,'win',won,'player_ms',seconds,'opponent_ms',enemy,
   'damage',damage,'cash_change',earned,'type',r.race_type,'stake',r.stake,
   'message',(CASE WHEN won THEN 'Victory against ' ELSE 'Lost against ' END)||(rival_data->>'name'),
   'champion',r.rival='cipher' AND won);
 UPDATE public.community_streetrod_season_races SET status='finished',finished_at=now(),
  total_ms=seconds,enemy_ms=enemy,won=(seconds<enemy and damage<52),detail=receipt WHERE id=r.id;
 INSERT INTO public.community_streetrod_season_history
 (user_id,season_no,day_no,event_type,caption,cash_change)
 VALUES(u,s.season_no,s.day_no,r.race_type||'_race',
  (CASE WHEN won THEN 'Won against ' ELSE 'Lost to ' END)||(rival_data->>'name'),earned);
 RETURN receipt||jsonb_build_object('state',public.community_streetrod_season_state());
END;
$function$;
$rival_ddl_6$;
 END IF;
END
$streetrod_rival_migration$;
