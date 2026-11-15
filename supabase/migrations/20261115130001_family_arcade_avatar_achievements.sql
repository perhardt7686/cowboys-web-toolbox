-- Earnable pets, outfits, gadgets, effects and scenes for two original arcade games and Dash Forge.
-- All metrics originate in server-verified run and achievement tables.
BEGIN;
alter table community_private.avatar_reward_achievement
 drop constraint if exists avatar_reward_achievement_group_id_check;
alter table community_private.avatar_reward_achievement
 add constraint avatar_reward_achievement_group_id_check
 check(group_id in ('mahjong','wordle','wordquest','plates','hotrod','cross','family','fleet','maze','dashforge'));
alter table community_private.avatar_reward_metric
 drop constraint if exists avatar_reward_metric_game_check;
alter table community_private.avatar_reward_metric
 add constraint avatar_reward_metric_game_check
 check(game in ('mahjong','wordle','wordquest','plates','hotrod','fleet','maze','dashforge'));
insert into community_private.avatar_reward_metric(id,game,label) values
('fleet-runs','fleet','Rounds completed'),
('fleet-best','fleet','Best verified score'),
('fleet-clears','fleet','Star Squadron clear'),
('maze-runs','maze','Rounds completed'),
('maze-best','maze','Best verified score'),
('maze-clears','maze','Complete the mystery maze'),
('dash-stages','dashforge','Distinct campaign stages cleared'),
('dash-bosses','dashforge','Verified campaign boss stages'),
('dash-designer','dashforge','Verified designer awards')
on conflict(id) do nothing;
CREATE OR REPLACE FUNCTION community_private.avatar_reward_metrics(p_member uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  with wordle_days as (
    select g.game_date, sum(g.points)::bigint as points, d.solved_at is not null as solved,
      coalesce(d.solved_by=p_member,false) as solver,
      d.solved_at is not null and exists (
        select 1 from public.community_wordle_guesses other
        join public.community_members member on member.user_id=other.user_id and member.status='approved'
        where other.game_date=g.game_date and other.user_id<>p_member and other.points>0
          and other.feedback && array['correct','present']
      ) as together
    from public.community_wordle_guesses g
    join public.community_wordle_days d on d.game_date=g.game_date
    where g.user_id=p_member and g.points>0 and g.feedback && array['correct','present']
    group by g.game_date,d.solved_at,d.solved_by
  ), wordle_streak as (
    select game_date - (row_number() over(order by game_date))::integer as starts
    from wordle_days where solved
  ), wordle_best as (
    select coalesce(max(n),0) as consecutive from (select count(*) as n from wordle_streak group by starts) runs
  ), quest_archived as (
    select a.game_date, a.solved_at, a.solved_by,
      count(*) filter(where g.pick->>'user_id'=p_member::text) as same_member,
      sum((g.pick->>'points')::integer) filter(where g.pick->>'user_id'=p_member::text) as points,
      count(*) filter(where helper.user_id is not null and helper.user_id<>p_member) as others
    from public.community_word_archived_rounds a
    cross join lateral jsonb_array_elements(case when jsonb_typeof(a.guesses)='array' then a.guesses else '[]'::jsonb end) g(pick)
    left join public.community_members helper on helper.user_id::text=g.pick->>'user_id' and helper.status='approved'
    where a.guesses @> jsonb_build_array(jsonb_build_object('user_id',p_member::text))
      and jsonb_typeof(g.pick->'points')='number'
      and (g.pick->>'points') ~ '^[0-9]{1,7}$'
      and (g.pick->'feedback') ?| array['correct','present']
    group by a.id,a.game_date,a.solved_at,a.solved_by
  ), quest_rounds as (
    select g.game_date, sum(g.points)::bigint as points, d.solved_at is not null as solved,
      coalesce(d.solved_by=p_member,false) as solver,
      d.solved_at is not null and exists (
        select 1 from public.community_word_guesses other
        join public.community_members member on member.user_id=other.user_id and member.status='approved'
        where other.game_date=g.game_date and other.user_id<>p_member
          and other.feedback && array['correct','present']
      ) as together
    from public.community_word_guesses g join public.community_word_days d on d.game_date=g.game_date
    where g.user_id=p_member and g.feedback && array['correct','present']
    group by g.game_date,d.solved_at,d.solved_by
    union all
    select game_date,points,solved_at is not null,coalesce(solved_by=p_member,false),
      solved_at is not null and others>0 from quest_archived where same_member>0
  ), plate_total as (
    select count(*) as eligible
    from public.community_plate_entries entry
    where entry.author_id=p_member and entry.status='approved' and entry.approved_at is not null
      and entry.approved_by<>entry.author_id and exists (
        select 1 from public.community_plate_votes vote
        join public.community_members member on member.user_id=vote.voter_id and member.status='approved'
        where vote.entry_id=entry.id and vote.voter_id=entry.approved_by and vote.approved
      )
  ), classic as (
    select count(*) filter(where rival<>'mystery' and
      (won or (kind='drag' and elapsed_ms>=15000) or (kind='road' and elapsed_ms>=55000))) as runs,
      count(*) filter(where kind='drag' and won and rival<>'mystery') as drags,
      count(*) filter(where kind='road' and won and rival<>'mystery') as roads,
      count(*) filter(where rival<>'mystery' and won) as wins,
      count(*) filter(where champion and won) as crowns,
      count(*) filter(where rival='mystery' and won) as mysteries,
      coalesce(sum(points),0)::bigint as points
    from community_private.hot_rod_result where user_id=p_member
  ), duels as (
    select count(*) filter(where mine.result->>'outcome'='finish' and other.result->>'outcome'='finish') as together,
      count(*) filter(where duel.winner=p_member and mine.result->>'outcome'='finish') as wins
    from community_private.hot_rod_duel duel
    join community_private.hot_rod_duel_run mine on mine.duel=duel.id and mine.user_id=p_member
    join community_private.hot_rod_duel_run other on other.duel=duel.id and other.user_id<>p_member
    join public.community_members member on member.user_id=other.user_id and member.status='approved'
    where duel.status='completed' and p_member in (duel.challenger,duel.challenged)
  )
  select jsonb_build_object(
    'mahj-wins',coalesce((select wins from public.community_mahjong_stats where user_id=p_member),0),
    'mahj-levels',coalesce((select levels_cleared from public.community_mahjong_campaign where user_id=p_member),0),
    'mahj-best',coalesce((select best_score from public.community_mahjong_stats where user_id=p_member),0),
    'wordle-clue-days',(select count(*) from wordle_days),
    'wordle-points',(select coalesce(sum(points),0) from wordle_days),
    'wordle-solves',(select count(*) from wordle_days where solved and solver),
    'wordle-team',(select count(*) from wordle_days where solved),
    'wordle-streak',(select consecutive from wordle_best),
    'wordle-coop',(select count(*) from wordle_days where together),
    'quest-clue-days',(select count(distinct game_date) from quest_rounds),
    'quest-xp',(select coalesce(sum(points),0)+25*count(distinct game_date) filter(where solved) from quest_rounds),
    'quest-solves',(select count(distinct game_date) from quest_rounds where solved and solver),
    'quest-team',(select count(distinct game_date) from quest_rounds where solved),
    'quest-coop',(select count(distinct game_date) from quest_rounds where together),
    'plates-approved',plate_total.eligible,
    'rod-runs',classic.runs,'rod-drags',classic.drags,'rod-roads',classic.roads,'rod-wins',classic.wins,
    'rod-crowns',classic.crowns,'rod-mystery',classic.mysteries,
    'fleet-runs',coalesce((select runs from public.community_retro_scores where user_id=p_member and game='fleet'),0),
    'fleet-best',coalesce((select best_score from public.community_retro_scores where user_id=p_member and game='fleet'),0),
    'fleet-clears',coalesce((select clears from public.community_retro_scores where user_id=p_member and game='fleet'),0),
    'maze-runs',coalesce((select runs from public.community_retro_scores where user_id=p_member and game='maze'),0),
    'maze-best',coalesce((select best_score from public.community_retro_scores where user_id=p_member and game='maze'),0),
    'maze-clears',coalesce((select clears from public.community_retro_scores where user_id=p_member and game='maze'),0),
    'dash-stages',(select count(*) from public.community_dash_progress progress
      join public.community_dash_levels level on level.id=progress.level_id
      where progress.user_id=p_member and progress.clears>0 and level.kind='campaign'),
    'dash-bosses',(select count(*) from public.community_dash_progress progress
      join public.community_dash_levels level on level.id=progress.level_id
      where progress.user_id=p_member and progress.clears>0 and level.kind='campaign' and level.boss is true),
    'dash-designer',(select count(*) from public.community_dash_awards award
      where award.user_id=p_member and award.award_type='designer'),
    'rod-points',classic.points+20*duels.wins,'rod-duels',duels.together
  )
  from plate_total,classic,duels;
$function$
;
insert into community_private.avatar_reward_achievement(id,name,tier,group_id,match_type,position) overriding system value values
('fleet-first-flight','First Flight','starter','fleet','all',50),
('fleet-scout','Star Scout','starter','fleet','all',51),
('fleet-ace','Squadron Ace','bronze','fleet','all',52),
('fleet-regular','Frequent Flier','bronze','fleet','all',53),
('fleet-gunner','Galaxy Gunner','silver','fleet','all',54),
('fleet-veteran','Star Veteran','gold','fleet','all',55),
('fleet-command','Squadron Commander','legendary','fleet','all',56),
('maze-first-clue','First Clue','starter','maze','all',57),
('maze-sleuth','Maze Sleuth','starter','maze','all',58),
('maze-tracker','Wisp Tracker','bronze','maze','all',59),
('maze-explorer','Maze Explorer','bronze','maze','all',60),
('maze-shadow','Shadow Chaser','silver','maze','all',61),
('maze-labyrinth','Labyrinth Conqueror','gold','maze','all',62),
('maze-master','Master of the Maze','legendary','maze','all',63),
('dash-first-clear','Dash First Clear','starter','dashforge','all',64),
('dash-five-levels','Five Dash Levels','starter','dashforge','all',65),
('dash-twentyfive','Twenty-Five Stages','bronze','dashforge','all',66),
('dash-first-boss','Boss Breaker','bronze','dashforge','all',67),
('dash-first-designer','Verified Designer','silver','dashforge','all',68),
('dash-century','Dash Century','gold','dashforge','all',69),
('dash-legend','Dash Legend','legendary','dashforge','all',70)
on conflict(id) do nothing;
insert into community_private.avatar_reward_requirement(achievement_id,metric_id,target,position) overriding system value values
('fleet-first-flight','fleet-runs',1,74),
('fleet-scout','fleet-best',60,75),
('fleet-ace','fleet-best',200,76),
('fleet-regular','fleet-runs',3,77),
('fleet-gunner','fleet-best',400,78),
('fleet-veteran','fleet-runs',10,79),
('fleet-command','fleet-best',650,80),
('maze-first-clue','maze-runs',1,81),
('maze-sleuth','maze-best',100,82),
('maze-tracker','maze-best',250,83),
('maze-explorer','maze-runs',4,84),
('maze-shadow','maze-best',450,85),
('maze-labyrinth','maze-clears',1,86),
('maze-master','maze-best',700,87),
('dash-first-clear','dash-stages',1,88),
('dash-five-levels','dash-stages',5,89),
('dash-twentyfive','dash-stages',25,90),
('dash-first-boss','dash-bosses',1,91),
('dash-first-designer','dash-designer',1,92),
('dash-century','dash-stages',100,93),
('dash-legend','dash-stages',250,94)
on conflict(achievement_id,metric_id) do nothing;
insert into community_private.avatar_reward_cosmetic(id,slot,achievement_id,name,tags,position) overriding system value values
('starling-owl','companion','fleet-first-flight','Starling Owl',array['arcade','retro','mystery']::text[],290),
('nebula-visor','eyewear','fleet-scout','Nebula Visor',array['arcade','retro','mystery']::text[],291),
('meteor-jetpack','prop','fleet-ace','Meteor Jetpack',array['arcade','retro','mystery']::text[],292),
('comet-signal','prop','fleet-regular','Comet Signal',array['arcade','retro','mystery']::text[],293),
('meteor-shower','effect','fleet-gunner','Meteor Shower',array['arcade','retro','mystery']::text[],294),
('starfield-cockpit','background','fleet-veteran','Starfield Cockpit',array['arcade','retro','mystery']::text[],295),
('queen-drone','companion','fleet-command','Queen Drone',array['arcade','retro','mystery']::text[],296),
('clue-mouse','companion','maze-first-clue','Clue Mouse',array['arcade','retro','mystery']::text[],297),
('wall-vision-glasses','eyewear','maze-sleuth','Wall-Vision Glasses',array['arcade','retro','mystery']::text[],298),
('spectral-keyring','prop','maze-tracker','Spectral Keyring',array['arcade','retro','mystery']::text[],299),
('spectral-lantern','prop','maze-explorer','Spectral Lantern',array['arcade','retro','mystery']::text[],300),
('ghost-echo','effect','maze-shadow','Ghost Echo',array['arcade','retro','mystery']::text[],301),
('ancient-keyway','background','maze-labyrinth','Ancient Keyway',array['arcade','retro','mystery']::text[],302),
('wisp-pup','companion','maze-master','Wisp Pup',array['arcade','retro','mystery']::text[],303),
('pixel-hamster','companion','dash-first-clear','Pixel Hamster',array['arcade','retro','mystery']::text[],304),
('neon-runner-shades','eyewear','dash-five-levels','Neon Runner Shades',array['arcade','retro','mystery']::text[],305),
('geometry-helmet','hat','dash-twentyfive','Geometry Helmet',array['arcade','retro','mystery']::text[],306),
('prism-trail','effect','dash-first-boss','Prism Trail',array['arcade','retro','mystery']::text[],307),
('boss-baton','prop','dash-first-designer','Boss Baton',array['arcade','retro','mystery']::text[],308),
('crystal-portal','background','dash-century','Crystal Portal',array['arcade','retro','mystery']::text[],309),
('boss-dragonlet','companion','dash-legend','Boss Dragonlet',array['arcade','retro','mystery']::text[],310)
on conflict(id) do nothing;
COMMIT;
