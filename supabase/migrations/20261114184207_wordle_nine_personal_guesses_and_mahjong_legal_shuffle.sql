begin;
-- Applied through Supabase migration 20261114184207.
-- The limit is per player, not a shared team cap. Preserve all recorded words,
-- green/gold/absent feedback, scores and Eastern-day histories.
alter table public.community_wordle_guesses drop constraint community_wordle_guesses_attempt_check;
alter table public.community_wordle_guesses add constraint community_wordle_guesses_attempt_check check (attempt between 1 and 32767);

CREATE OR REPLACE FUNCTION public.community_mahjong_shuffle()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare r public.community_mahjong_runs%rowtype;new_board jsonb;v_try int;v_pairs int:=0;
begin
 if not public.community_mahjong_allowed() then raise exception 'Approved Commons membership is required' using errcode='42501';end if;
 select * into r from public.community_mahjong_runs where user_id=auth.uid() and status='active' limit 1 for update;
 if not found then raise exception 'Start a game first';end if;

 if r.paused_at is not null then raise exception 'Game is paused. Resume to continue.';end if;
 -- A shuffle is never saved or charged unless the new layout exposes a legal pair.
 for v_try in 1..8 loop
   begin
     new_board:=public.community_mahjong_build(r.tiles);
     select count(*)::int into v_pairs
       from jsonb_array_elements(new_board) a(e)
       join jsonb_array_elements(new_board) b(e)
         on (a.e->>'s')::int=(b.e->>'s')::int
         and (a.e->>'id')::int<(b.e->>'id')::int
       where not (a.e->>'gone')::boolean and not (b.e->>'gone')::boolean
         and public.community_mahjong_free(new_board,(a.e->>'id')::int)
         and public.community_mahjong_free(new_board,(b.e->>'id')::int);
     if v_pairs>0 then exit;end if;
   exception when raise_exception then
     -- A randomly chosen solvable-tile placement may dead-end midway.
     -- Retry from the unchanged saved board, without charging the player.
     new_board:=null;
     v_pairs:=0;
   end;
 end loop;
 if new_board is null or v_pairs<1 then
   return public.community_mahjong_state()||jsonb_build_object('event','shuffle_unavailable','available_pairs',0);
 end if;
 update public.community_mahjong_runs set tiles=new_board,shuffles=shuffles+1,combo=0,
 score=greatest(0,score-150),updated_at=now(),moves='[]'::jsonb where id=r.id;
 return public.community_mahjong_state()||jsonb_build_object('event','shuffled','available_pairs',v_pairs);
end $function$;

CREATE OR REPLACE FUNCTION public.community_word_shared_history(p_game text, p_before date DEFAULT NULL::date, p_limit integer DEFAULT 14)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
 v_user uuid:=auth.uid();
 v_day date:=(now() at time zone 'America/New_York')::date;
 v_limit integer:=least(greatest(coalesce(p_limit,14),1),30);
 v_rounds jsonb;
 v_next date;
begin
 if v_user is null or not exists
    (select 1 from public.community_members m where m.user_id=v_user and m.status='approved') then
   raise exception 'Approved membership required' using errcode='42501';
 end if;
 if p_game not in ('quest','w0rdle') or p_game is null then
   raise exception 'Choose quest or w0rdle' using errcode='22023';
 end if;
 if p_game='quest' then
   with days as (
     select d.game_date,d.word_id,d.solved_at,d.team_score,b.answer,b.difficulty
     from public.community_word_days d
     join public.community_word_bank b on b.id=d.word_id
     where d.game_date <=v_day and d.game_date<coalesce(p_before,v_day+1)
     order by d.game_date desc limit v_limit
   ),
   results as (
     select days.game_date, jsonb_build_object(
       'day',days.game_date,'difficulty',days.difficulty,'points',days.team_score,
       'solved',days.solved_at is not null,
       'answer',case when days.game_date<v_day or days.solved_at is not null or
          (select count(*) from public.community_word_guesses g where g.game_date=days.game_date)>=12 then days.answer else null end,
       'guesses',coalesce((select jsonb_agg(jsonb_build_object(
          'guess',g.guess,'feedback',g.feedback,'at',g.created_at,
          'name',coalesce(m.display_name,'Member'),'user_id',g.user_id,'points',g.points
          ) order by g.id)
          from public.community_word_guesses g
          left join public.community_members m on m.user_id=g.user_id
          where g.game_date=days.game_date),'[]'::jsonb),
       'archived',coalesce((select jsonb_agg(jsonb_build_object(
          'answer',b.answer,'guesses',a.guesses,'solved',a.solved_at is not null,'points',a.team_score
          ) order by a.archived_at)
          from public.community_word_archived_rounds a
          join public.community_word_bank b on b.id=a.original_word_id
          where a.game_date=days.game_date),'[]'::jsonb)
      ) as item
     from days
   )
   select coalesce(jsonb_agg(item order by game_date desc),'[]'::jsonb),min(game_date)
   into v_rounds,v_next from results;
 else
   with days as (
     select d.game_date,d.word_id,d.solved_at,b.answer,b.difficulty
     from public.community_wordle_days d
     join public.community_word_bank b on b.id=d.word_id
     where d.game_date <=v_day and d.game_date<coalesce(p_before,v_day+1)
     order by d.game_date desc limit v_limit
   ),
   results as (
     select days.game_date, jsonb_build_object(
       'day',days.game_date,'difficulty',days.difficulty,
       'solved',days.solved_at is not null,
       'answer',case when days.game_date<v_day or days.solved_at is not null then days.answer else null end,
       'guesses',coalesce((select jsonb_agg(jsonb_build_object(
          'guess',g.guess,'feedback',g.feedback,'at',g.created_at,
          'name',coalesce(m.display_name,'Member'),'user_id',g.user_id,'points',g.points,'attempt',g.attempt
          ) order by g.attempt)
          from public.community_wordle_guesses g
          left join public.community_members m on m.user_id=g.user_id
          where g.game_date=days.game_date),'[]'::jsonb),
       'archived','[]'::jsonb
      ) as item
     from days
   )
   select coalesce(jsonb_agg(item order by game_date desc),'[]'::jsonb),min(game_date)
   into v_rounds,v_next from results;
 end if;
 return jsonb_build_object('game',p_game,'rounds',v_rounds,'older_before',v_next,
  'can_load_older',jsonb_array_length(v_rounds)=v_limit);
end
$function$;

CREATE OR REPLACE FUNCTION public.community_wordle_state()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
 v_user uuid:=auth.uid();
 v_day date:=(now() at time zone 'America/New_York')::date;
 v_answer text;v_difficulty text;
 v_count int;v_limit int;v_mine_count int;v_guesses jsonb;v_ranking jsonb;v_mine jsonb;
 v_solved boolean;v_team_points int;
begin
 if v_user is null or not exists(select 1 from public.community_members where user_id=v_user and status='approved') then
  raise exception 'Approved membership required' using errcode='42501';
 end if;
 insert into public.community_word_days(game_date,word_id) values(v_day,public.community_word_pick(v_day))
 on conflict(game_date) do nothing;
 insert into public.community_wordle_days(game_date,word_id)
 select game_date,word_id from public.community_word_days where game_date=v_day
 on conflict(game_date) do update set word_id=excluded.word_id
 where public.community_wordle_days.word_id<>excluded.word_id
 and not exists(select 1 from public.community_wordle_guesses where game_date=v_day);
 select b.answer,b.difficulty into v_answer,v_difficulty
 from public.community_wordle_days d join public.community_word_bank b on b.id=d.word_id
 where d.game_date=v_day;
 v_limit:=9;
 select count(*),coalesce(sum(g.points),0)
 into v_count,v_team_points from public.community_wordle_guesses g where g.game_date=v_day;
 select count(*) into v_mine_count from public.community_wordle_guesses g where g.game_date=v_day and g.user_id=v_user;
 select exists(select 1 from public.community_wordle_guesses g where g.game_date=v_day and g.guess=v_answer) into v_solved;
 select coalesce(jsonb_agg(jsonb_build_object(
    'guess',g.guess,'feedback',g.feedback,'at',g.created_at,
    'attempt',g.attempt,'name',coalesce(m.display_name,'Member'),
    'user_id',g.user_id,'points',g.points
 ) order by g.attempt),'[]'::jsonb)
 into v_guesses from public.community_wordle_guesses g
 left join public.community_members m on m.user_id=g.user_id
 where g.game_date=v_day;
 select coalesce(jsonb_agg(jsonb_build_object(
   'name',m.display_name,'user_id',s.user_id,'wins',s.wins,'solves',s.solves,
   'played',s.games_played,'points',s.total_points,
   'today_points',coalesce((select sum(g.points) from public.community_wordle_guesses g where g.user_id=s.user_id and g.game_date=v_day),0)
       +(case when v_solved and exists(select 1 from public.community_wordle_guesses g where g.user_id=s.user_id and g.game_date=v_day) then 35 else 0 end),
   'streak',case when s.last_win>=v_day-1 then s.current_streak else 0 end,
   'best',s.best_streak
 ) order by s.total_points desc,s.wins desc,m.display_name),'[]'::jsonb)
 into v_ranking from
 (select * from public.community_wordle_scores order by total_points desc,wins desc limit 30) s
 join public.community_members m on m.user_id=s.user_id and m.status='approved';
 select jsonb_build_object('wins',s.wins,'solves',s.solves,'played',s.games_played,'points',s.total_points,
 'today_points',coalesce((select sum(g.points) from public.community_wordle_guesses g where g.user_id=s.user_id and g.game_date=v_day),0)
       +(case when v_solved and exists(select 1 from public.community_wordle_guesses g where g.user_id=s.user_id and g.game_date=v_day) then 35 else 0 end),
 'streak',case when s.last_win>=v_day-1 then s.current_streak else 0 end,'best',s.best_streak)
 into v_mine from public.community_wordle_scores s where s.user_id=v_user;
 return jsonb_build_object(
 'day',v_day,'difficulty',v_difficulty,'attempts',v_count,'team_attempts',v_count,
 'max_attempts',v_limit,'max_per_player',v_limit,'my_attempts',v_mine_count,
 'remaining',greatest(0,v_limit-v_mine_count),'my_remaining',greatest(0,v_limit-v_mine_count),
 'solved',v_solved,'finished',v_solved or v_mine_count>=v_limit,
 'answer',case when v_solved then v_answer else null end,
 'shared_word',true,'team_points',v_team_points+(case when v_solved then 35*(select count(distinct user_id) from public.community_wordle_guesses where game_date=v_day) else 0 end),
 'guesses',v_guesses,'ranking',v_ranking,'my',coalesce(v_mine,'{}'::jsonb),'user_id',v_user);
end
$function$;

CREATE OR REPLACE FUNCTION public.community_wordle_submit(p_guess text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
 v_user uuid:=auth.uid();
 v_day date:=(now() at time zone 'America/New_York')::date;
 v_guess text:=upper(trim(coalesce(p_guess,'')));
 v_answer text;v_difficulty text;v_limit int;v_attempt int;v_personal int;v_points int:=0;
 v_feedback text[]:=array_fill('absent'::text,array[5]);
 v_used bool[]:=array_fill(false,array[5]);
 i int;j int;
begin
 if v_user is null or not exists(select 1 from public.community_members where user_id=v_user and status='approved') then
  raise exception 'Approved membership required' using errcode='42501';
 end if;
 if v_guess!~'^[A-Z]{5}$' then raise exception 'Enter exactly five letters';end if;
 perform pg_advisory_xact_lock(hashtext('cowboy-w0rdle'),hashtext(v_day::text));
 insert into public.community_word_days(game_date,word_id) values(v_day,public.community_word_pick(v_day))
 on conflict(game_date) do nothing;
 insert into public.community_wordle_days(game_date,word_id)
 select game_date,word_id from public.community_word_days where game_date=v_day
 on conflict(game_date) do update set word_id=excluded.word_id
 where public.community_wordle_days.word_id<>excluded.word_id
 and not exists(select 1 from public.community_wordle_guesses where game_date=v_day);
 select b.answer,b.difficulty into v_answer,v_difficulty
 from public.community_wordle_days d join public.community_word_bank b on b.id=d.word_id where d.game_date=v_day;
 v_limit:=9;
 select count(*) into v_attempt from public.community_wordle_guesses where game_date=v_day;
 select count(*) into v_personal from public.community_wordle_guesses where game_date=v_day and user_id=v_user;
 if exists(select 1 from public.community_wordle_guesses where game_date=v_day and guess=v_answer) then
  raise exception 'Your team has solved today''s puzzle';
 end if;
 if v_personal>=v_limit then
  raise exception 'You have used all nine personal guesses today';
 end if;
 if exists(select 1 from public.community_wordle_guesses where game_date=v_day and guess=v_guess) then
  raise exception 'Your team already guessed that word';
 end if;
 if exists(select 1 from public.community_wordle_guesses where game_date=v_day and user_id=v_user and created_at>now()-interval '6 seconds') then
  raise exception 'Give teammates a moment before guessing again';
 end if;
 for i in 1..5 loop
  if substr(v_guess,i,1)=substr(v_answer,i,1) then
   v_feedback[i]:='correct';v_used[i]:=true;
  end if;
 end loop;
 for i in 1..5 loop
  if v_feedback[i]<>'correct' then
   for j in 1..5 loop
    if not v_used[j] and substr(v_guess,i,1)=substr(v_answer,j,1) then
     v_feedback[i]:='present';v_used[j]:=true;exit;
    end if;
   end loop;
  end if;
 end loop;
 for i in 1..5 loop
  v_points:=v_points+case v_feedback[i] when 'correct' then 12 when 'present' then 5 else 0 end;
 end loop;
 if v_guess=v_answer then
  v_points:=v_points+150+(v_limit-v_personal-1)*20
    +case v_difficulty when 'nightmare' then 160 when 'hard' then 90 when 'medium' then 35 else 0 end;
 end if;
 insert into public.community_wordle_guesses(game_date,user_id,attempt,guess,feedback,points)
 values(v_day,v_user,v_attempt+1,v_guess,v_feedback,v_points);
 insert into public.community_wordle_scores(user_id,games_played,total_points,last_played)
 values(v_user,1,v_points,v_day)
 on conflict(user_id) do update set
 games_played=public.community_wordle_scores.games_played+
 case when public.community_wordle_scores.last_played=v_day then 0 else 1 end,
 total_points=public.community_wordle_scores.total_points+excluded.total_points,last_played=v_day;
 if v_guess=v_answer then
  update public.community_wordle_days set solved_at=now(),solved_by=v_user where game_date=v_day;
  update public.community_wordle_scores s set
   wins=s.wins+1,
   total_points=s.total_points+35,
   solves=s.solves+case when s.user_id=v_user then 1 else 0 end,
   current_streak=case when s.last_win=v_day-1 then s.current_streak+1 else 1 end,
   best_streak=greatest(s.best_streak,case when s.last_win=v_day-1 then s.current_streak+1 else 1 end),
   last_win=v_day
  where exists(select 1 from public.community_wordle_guesses g where g.game_date=v_day and g.user_id=s.user_id);

 end if;
 return public.community_wordle_state();
end
$function$;
commit;
