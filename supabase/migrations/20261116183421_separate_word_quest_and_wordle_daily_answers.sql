-- Mirror of live, successfully applied Supabase migration version 20261116183421.
-- Preserve existing daily answers, guesses, feedback, scores, badges and history.
-- Each game now picks a DIFFERENT five-letter answer for new Eastern-calendar days.
-- Defensive triggers reject accidental future cross-game answer collisions at DB level.
-- Both games still share clues and guesses within their own team game.


CREATE OR REPLACE FUNCTION public.community_wordle_pick(p_day date)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
WITH tier AS (
 SELECT CASE
  WHEN p_day = date '2026-11-12' THEN 'hard'
  WHEN mod(abs(hashtext(p_day::text || '/wordle-tier/2')::bigint),100)<24 THEN 'easy'
  WHEN mod(abs(hashtext(p_day::text || '/wordle-tier/2')::bigint),100)<56 THEN 'medium'
  WHEN mod(abs(hashtext(p_day::text || '/wordle-tier/2')::bigint),100)<90 THEN 'hard'
  ELSE 'nightmare' END AS name
), quest AS (
 SELECT upper(b.answer) AS answer
 FROM public.community_word_bank b
 WHERE b.id = coalesce(
  (SELECT d.word_id FROM public.community_word_days d WHERE d.game_date=p_day),
  public.community_word_pick(p_day))
)
SELECT coalesce(
 (SELECT b.id FROM public.community_word_bank b CROSS JOIN tier t CROSS JOIN quest q
  WHERE b.difficulty=t.name AND upper(b.answer)<>q.answer
   AND NOT EXISTS (
    SELECT 1 FROM public.community_wordle_days d
    WHERE d.game_date>=p_day-30 AND d.game_date<p_day AND d.word_id=b.id)
  ORDER BY md5(p_day::text || b.answer || '/cowboy-daily-letter-match-v2') LIMIT 1),
 (SELECT b.id FROM public.community_word_bank b CROSS JOIN tier t CROSS JOIN quest q
  WHERE b.difficulty=t.name AND upper(b.answer)<>q.answer
  ORDER BY md5(p_day::text || b.answer || '/cowboy-daily-letter-match-v2') LIMIT 1),
 (SELECT b.id FROM public.community_word_bank b CROSS JOIN quest q
  WHERE upper(b.answer)<>q.answer
  ORDER BY md5(p_day::text || b.answer || '/cowboy-daily-letter-match-v2') LIMIT 1)
)
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
 values(v_day,public.community_wordle_pick(v_day))
 on conflict(game_date) do nothing;
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
 values(v_day,public.community_wordle_pick(v_day))
 on conflict(game_date) do nothing;
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

CREATE OR REPLACE FUNCTION public.community_distinct_daily_answers_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE v_other_answer text;v_new_answer text;
BEGIN
 IF TG_OP='UPDATE' AND NEW.word_id=OLD.word_id THEN RETURN NEW; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('cowboy-daily-word-distinct'),hashtext(NEW.game_date::text));
 SELECT upper(b.answer) INTO v_new_answer
 FROM public.community_word_bank b WHERE b.id=NEW.word_id;
 IF v_new_answer IS NULL THEN
  RAISE EXCEPTION 'Invalid daily word bank selection' USING ERRCODE='23514';
 END IF;
 IF TG_TABLE_NAME='community_word_days' THEN
  SELECT upper(b.answer) INTO v_other_answer
  FROM public.community_wordle_days d
  JOIN public.community_word_bank b ON b.id=d.word_id
  WHERE d.game_date=NEW.game_date;
 ELSIF TG_TABLE_NAME='community_wordle_days' THEN
  SELECT upper(b.answer) INTO v_other_answer
  FROM public.community_word_days d
  JOIN public.community_word_bank b ON b.id=d.word_id
  WHERE d.game_date=NEW.game_date;
 ELSE RAISE EXCEPTION 'Unrecognized daily word game' USING ERRCODE='23514';
 END IF;
 IF v_other_answer IS NOT NULL AND v_other_answer=v_new_answer THEN
  RAISE EXCEPTION 'Daily Word Quest and w0rdle must have different answers'
    USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END
$function$;

REVOKE ALL ON FUNCTION public.community_distinct_daily_answers_guard() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS community_quest_distinct_answer ON public.community_word_days;

CREATE TRIGGER community_quest_distinct_answer AFTER INSERT OR UPDATE OF word_id ON public.community_word_days FOR EACH ROW EXECUTE FUNCTION community_distinct_daily_answers_guard();

DROP TRIGGER IF EXISTS community_wordle_distinct_answer ON public.community_wordle_days;

CREATE TRIGGER community_wordle_distinct_answer AFTER INSERT OR UPDATE OF word_id ON public.community_wordle_days FOR EACH ROW EXECUTE FUNCTION community_distinct_daily_answers_guard();
