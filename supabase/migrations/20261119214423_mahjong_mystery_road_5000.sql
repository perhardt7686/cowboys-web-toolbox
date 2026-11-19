-- Mystery Road 5,000-stage nature expansion: non-destructive continuation.
-- Preserve original 1,000 milestones, scores, family progress and all old badges.
-- This file is deployed via Supabase migration only after CI succeeds.
-- No new exposed tables, JWT changes, RLS bypass, external network or service keys.
-- New badge names are whitelisted, not minted from user-supplied text.
-- Supabase's migration executor wraps this script in its own transaction.
ALTER TABLE public.community_mahjong_campaign DROP CONSTRAINT IF EXISTS community_mahjong_campaign_level_check;
ALTER TABLE public.community_mahjong_campaign ADD CONSTRAINT community_mahjong_campaign_level_check CHECK (level between 1 and 5000);

ALTER TABLE public.community_mahjong_campaign DROP CONSTRAINT IF EXISTS community_mahjong_campaign_levels_cleared_check;
ALTER TABLE public.community_mahjong_campaign ADD CONSTRAINT community_mahjong_campaign_levels_cleared_check CHECK (levels_cleared between 0 and 5000);

ALTER TABLE public.community_mahjong_campaign DROP CONSTRAINT IF EXISTS community_mahjong_campaign_qualified_streak_check;
ALTER TABLE public.community_mahjong_campaign ADD CONSTRAINT community_mahjong_campaign_qualified_streak_check CHECK (qualified_streak between 0 and 5000);

ALTER TABLE public.community_mahjong_campaign DROP CONSTRAINT IF EXISTS community_mahjong_campaign_longest_streak_check;
ALTER TABLE public.community_mahjong_campaign ADD CONSTRAINT community_mahjong_campaign_longest_streak_check CHECK (longest_streak between 0 and 5000);

ALTER TABLE public.community_mahjong_runs DROP CONSTRAINT IF EXISTS community_mahjong_runs_level_check;
ALTER TABLE public.community_mahjong_runs ADD CONSTRAINT community_mahjong_runs_level_check CHECK (level between 1 and 5000);

ALTER TABLE public.community_mahjong_campaign_attempts DROP CONSTRAINT IF EXISTS community_mahjong_campaign_attempts_level_check;
ALTER TABLE public.community_mahjong_campaign_attempts ADD CONSTRAINT community_mahjong_campaign_attempts_level_check CHECK (level between 1 and 5000);

ALTER TABLE public.community_mahjong_badges DROP CONSTRAINT IF EXISTS community_mahjong_badges_code_check;
ALTER TABLE public.community_mahjong_badges ADD CONSTRAINT community_mahjong_badges_code_check CHECK (code=ANY(ARRAY['first_pair','ten_pairs','fifty_pairs','century','first_win','triple_crown','ten_wins','unassisted','speedster','five_thousand','campaign_5','campaign_10','campaign_25','campaign_50','campaign_100','campaign_250','campaign_500','campaign_1000','campaign_1500','campaign_2000','campaign_2500','campaign_3000','campaign_3500','campaign_4000','campaign_4500','campaign_5000']));
CREATE OR REPLACE FUNCTION public.community_mahjong_level_rules(p_level integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v int:=least(5000,greatest(1,coalesce(p_level,1))); label text; multiplier numeric; assistance int; seconds int:=null;needs_streak int:=0;tier int;region_name text;challenge_name text;
begin
 region_name:=(ARRAY['Daisy Lane','Buttercup Fields','Fern Hollow','Bluebird Grove','Lavender Vale','Foxglove Trail','Butterfly Meadow','Heron Marsh','Rose Arbor','Moon Orchid Garden','Firefly Thicket','Copperwood Canopy','Crystal Creek','Snowdrop Copse','Golden Sunflower Pass','Emerald Rainforest','Waterlily Lagoon','Starlit Briar','Aurora Conservatory','Evergreen Sanctuary'])[1+((v-1)/250)];
 challenge_name:=(ARRAY['Bloom Walk','Wildlife Watch','Creek Crossing','Rare Flower','Twilight Trail','Firefly Rush','Wild Growth','Quiet Sanctuary'])[1+mod(v*7+(v/11),8)];
 if v<=10 then label:='Mystery Mile';tier:=1;multiplier:=1;assistance:=99;
 elsif v<=25 then label:='Foggy Highway';tier:=2;multiplier:=1.25;assistance:=3;
 elsif v<=50 then label:='Haunted Orchard';tier:=3;multiplier:=1.5;assistance:=1;
 elsif v<=100 then label:='Phantom Manor';tier:=4;multiplier:=2;assistance:=1;
 elsif v<=250 then label:='Black Lagoon';tier:=5;multiplier:=3;assistance:=0;seconds:=1200;
 elsif v<=500 then label:='Midnight Chase';tier:=6;multiplier:=4;assistance:=0;seconds:=900;
 elsif v<=999 then label:='Ghost Road';tier:=7;multiplier:=5;assistance:=0;seconds:=600;
 elsif v=1000 then
  -- Prior 1,000-level crown remains an earned milestone. A 10-win *required*
  -- streak at a single final stage deadlocks players after one failed attempt;
  -- 10-streak stays an aspirational badge, not a non-recoverable progress gate.
  label:='The Vanishing Crown';tier:=8;multiplier:=10;assistance:=0;seconds:=300;needs_streak:=0;
 else
  -- Past the original milestone, vary easy/tough stage rhythm within each
  -- garden rather than monotonically tightening time until it is unplayable.
  label:=region_name||' · '||challenge_name;
  tier:=case mod(v,12) when 0 then 8 when 1 then 2 when 2 then 4
    when 3 then 6 when 4 then 3 when 5 then 7 when 6 then 5
    when 7 then 3 when 8 then 6 when 9 then 4 when 10 then 7 else 5 end;
  multiplier:=least(20,5 + ((v-1001)/800.0)::numeric + (tier-4)*0.5);
  assistance:=case mod(v,12) when 1 then 3 when 4 then 2 when 7 then 2
    when 10 then 1 else 0 end;
  seconds:=case when mod(v,12) in (1,4,7,10) then null
    else greatest(240,900-((v-1001)/800)*90) end;
  needs_streak:=0;
  if v=5000 then
    label:='The Evergreen Crown';tier:=8;multiplier:=20;assistance:=0;seconds:=300;
  end if;
 end if;
 if v between 101 and 250 then seconds:=1200-round((v-101)*300.0/149.0)::integer;
 elsif v between 251 and 500 then seconds:=900-round((v-251)*300.0/249.0)::integer;
 elsif v between 501 and 999 then seconds:=600-round((v-501)*240.0/498.0)::integer;
 end if;
 return jsonb_build_object('level',v,'tier',tier,'name',label,'multiplier',multiplier,
 'max_assists',assistance,'max_seconds',seconds,'required_streak',needs_streak,
 'total_levels',5000,'region',region_name,'encounter',challenge_name,'checkpoint',(v%25=0),'layout',case when tier<=1 then 'garden' when tier<=2 then 'ring' when tier<=4 then 'cross' when tier<=5 then 'fortress' else 'citadel' end);
end $function$;

CREATE OR REPLACE FUNCTION public.community_mahjong_advance(p_user uuid, p_run uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare r public.community_mahjong_runs%rowtype;c public.community_mahjong_campaign%rowtype;
 rules jsonb;elapsed integer;total_helpers integer;qualified boolean;reason text:='';bonus integer:=0;
 award text;next_level integer;required_streak integer;
begin
 if not public.community_mahjong_allowed() or auth.uid() is distinct from p_user then
 raise exception 'Only current player can earn a level' using errcode='42501';end if;
 select * into r from public.community_mahjong_runs where id=p_run and user_id=p_user and status='won' for update;
 if not found then raise exception 'Completed run not found';end if;
 select * into c from public.community_mahjong_campaign where user_id=p_user for update;
 if not found then
  insert into public.community_mahjong_campaign(user_id) values(p_user);
  select * into c from public.community_mahjong_campaign where user_id=p_user for update;
 end if;
 -- The final garden may remain replayable for normal score/record purposes,
 -- but it must never repeatedly increase already completed campaign milestones.
 if c.level=5000 and c.levels_cleared>=5000 then
  return jsonb_build_object('campaign_event','complete','campaign_bonus_earned',0,
   'campaign_message','All 5,000 gardens are complete.','completed_level',5000,'next_level',5000);
 end if;
 if exists(select 1 from public.community_mahjong_campaign_attempts where run_id=p_run) then
  return jsonb_build_object('campaign_event','already_counted');end if;
 elapsed:=greatest(0,ceil(extract(epoch from coalesce(r.finished_at,now())-r.started_at)-r.paused_seconds)::integer);
 if r.level<>c.level then
  qualified:=false;reason:='This board belongs to a different stage. Start the current stage.';
 else
  rules:=public.community_mahjong_level_rules(r.level);
  total_helpers:=r.hints+r.shuffles+r.undos;
  qualified:=total_helpers<=(rules->>'max_assists')::integer;
  if r.level between 51 and 100 and (r.hints>0 or r.shuffles>0) then qualified:=false;end if;
  if rules->>'max_seconds' <> 'null' and elapsed>(rules->>'max_seconds')::integer then qualified:=false;end if;
  required_streak:=(rules->>'required_streak')::integer;
  if required_streak>0 and c.qualified_streak<required_streak then qualified:=false;end if;
  if not qualified then reason:='Board cleared, but stage requirements were missed. Replay this level.';end if;
 end if;
 if qualified then
  next_level:=least(5000,c.level+1);
  bonus:=200+c.level*12;
  update public.community_mahjong_runs set score=score+bonus where id=p_run;
  perform set_config('mahjong.campaign_bonus_update','yes',true);
  update public.community_mahjong_stats set all_time_points=all_time_points+bonus,
    best_score=greatest(best_score,(select score from public.community_mahjong_runs where id=p_run)),updated_at=now()
    where user_id=p_user;
  perform set_config('mahjong.campaign_bonus_update','no',true);
  update public.community_mahjong_campaign
   set levels_cleared=least(5000,levels_cleared+1),
       level=next_level,
       qualified_streak=least(5000,qualified_streak+1),
       longest_streak=greatest(longest_streak,qualified_streak+1),
       campaign_bonus=campaign_bonus+bonus,
       crown_earned=crown_earned or (c.level=1000),updated_at=now()
   where user_id=p_user;
  award:=case c.level when 5 then 'campaign_5' when 10 then 'campaign_10' when 25 then 'campaign_25'
      when 50 then 'campaign_50' when 100 then 'campaign_100' when 250 then 'campaign_250'
      when 500 then 'campaign_500' when 1000 then 'campaign_1000' when 1500 then 'campaign_1500' when 2000 then 'campaign_2000' when 2500 then 'campaign_2500' when 3000 then 'campaign_3000' when 3500 then 'campaign_3500' when 4000 then 'campaign_4000' when 4500 then 'campaign_4500' when 5000 then 'campaign_5000' else null end;
  if award is not null then
   insert into public.community_mahjong_badges(user_id,code) values(p_user,award) on conflict do nothing;
  end if;
  reason:='Stage passed. The next mystery is unlocked.';
 else
  update public.community_mahjong_campaign set qualified_streak=0,updated_at=now() where user_id=p_user;
 end if;
 insert into public.community_mahjong_campaign_attempts(run_id,user_id,level,qualified,time_seconds,bonus,reason)
 values(p_run,p_user,r.level,qualified,elapsed,bonus,reason);
 return jsonb_build_object('campaign_event',case when qualified then 'advanced' else 'retry' end,
 'campaign_bonus_earned',bonus,'campaign_message',reason,'completed_level',r.level,
 'next_level',case when qualified then next_level else c.level end);
end $function$;
