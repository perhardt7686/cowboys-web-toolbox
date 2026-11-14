-- This live migration is authoritative on the production Supabase project.
-- PGlite CI only loads committed legacy migrations; some seasonal tables were
-- originally introduced directly on the live project, not in that test seed.
-- Skip gracefully when these real tables are absent, rather than breaking
-- unrelated tests. When deployed to a complete database, apply the full RPC.
DO $apply_streetrod_20261114$
BEGIN
 IF to_regclass('public.community_streetrod_season_races') IS NOT NULL
    AND to_regclass('public.community_streetrod_seasons') IS NOT NULL
    AND to_regclass('public.community_streetrod_season_cars') IS NOT NULL THEN
  EXECUTE $authentic_streetrod_ddl$
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
 sim jsonb;seconds integer;enemy integer;damage integer;earned integer:=0;
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
  enemy:=(CASE r.rival WHEN 'rookie' THEN 149000 WHEN 'cruiser' THEN 135000
    WHEN 'hotshot' THEN 121000 ELSE 108000 END)+(r.seed%21-10)*180;
  days:=2;
 ELSE
  seconds:=(sim->>'total_ms')::integer+least(18000,round(mistake*175)::integer)
      +(100-car.condition)*21;
  enemy:=(CASE r.rival WHEN 'rookie' THEN 17500 WHEN 'cruiser' THEN 15500
    WHEN 'hotshot' THEN 13600 ELSE 11500 END)+(r.seed%21-10)*61;
  days:=1;
 END IF;
 won:=seconds<enemy AND damage<52;
 IF r.stake<>'practice' THEN
  IF won THEN
   earned:=(CASE r.rival WHEN 'rookie' THEN 85 WHEN 'cruiser' THEN 150
     WHEN 'hotshot' THEN 250 ELSE 600 END)
     +(CASE WHEN r.stake='title' THEN 0 ELSE r.stake::integer END);
  ELSIF r.stake<>'title' THEN earned:= -r.stake::integer;
  END IF;
 END IF;
 UPDATE public.community_streetrod_season_cars SET
  fuel=greatest(0,fuel-(CASE WHEN r.race_type='road' THEN 18 ELSE 7 END)),
  condition=greatest(0,condition-damage-1)
 WHERE user_id=u AND car_key=r.car_key;
 IF r.stake='title' THEN
  other_car:=(CASE r.rival WHEN 'rookie' THEN 'dustline32' WHEN 'cruiser' THEN 'comet'
    WHEN 'hotshot' THEN 'nomad' ELSE 'phantom' END);
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
   'message',(CASE WHEN won THEN 'Victory against ' ELSE 'Lost against ' END)||r.rival,
   'champion',r.rival='cipher' AND won);
 UPDATE public.community_streetrod_season_races SET status='finished',finished_at=now(),
  total_ms=seconds,enemy_ms=enemy,won=(seconds<enemy and damage<52),detail=receipt WHERE id=r.id;
 INSERT INTO public.community_streetrod_season_history
 (user_id,season_no,day_no,event_type,caption,cash_change)
 VALUES(u,s.season_no,s.day_no,r.race_type||'_race',
  (CASE WHEN won THEN 'Won against ' ELSE 'Lost to ' END)||r.rival,earned);
 RETURN receipt||jsonb_build_object('state',public.community_streetrod_season_state());
END;
$function$;
$authentic_streetrod_ddl$;
 END IF;
END
$apply_streetrod_20261114$;
