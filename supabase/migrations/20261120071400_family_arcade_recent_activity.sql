-- Last REAL family arcade interactions, for the members-only Family Fun marquee.
-- Read-only and approved-member scoped: no invented last-play times from dashboard opens.
-- Drawing Studio and Study Cards currently have no compatible server activity events.
create or replace function public.community_family_arcade_activity()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  viewer uuid := auth.uid();
  result jsonb;
begin
  if viewer is null or not exists(
    select 1 from public.community_members m
     where m.user_id=viewer and m.status='approved'
  ) then
    raise exception 'Approved family membership required' using errcode='42501';
  end if;
  with event_rows as (
    select 'streetrod'::text game, r.user_id,coalesce(r.finished_at,r.started_at) played_at
      from public.community_streetrod_runs r where r.started_at is not null
    union all
    select 'streetrod',r.user_id,coalesce(r.finished_at,r.started_at)
      from public.community_streetrod_season_races r where r.started_at is not null
    union all
    select 'streetrod',r.user_id,r.created_at
      from community_private.hot_rod_result r
    union all
    select 'dashforge',r.user_id,coalesce(r.finished_at,r.started_at)
      from public.community_dash_runs r where r.started_at is not null
    union all
    select 'skyboard',r.user_id,coalesce(r.finished_at,r.started_at)
      from public.community_boardride_runs r where r.started_at is not null
    union all
    select r.game,r.user_id,coalesce(r.finished_at,r.started_at)
      from public.community_retro_runs r
      where r.game in ('fleet','maze') and r.started_at is not null
    union all
    select 'mahjong',r.user_id,coalesce(r.finished_at,r.started_at)
      from public.community_mahjong_runs r where r.started_at is not null
    union all
    select 'wordle',g.user_id,g.created_at
      from public.community_wordle_guesses g
    union all
    select 'wordquest',g.user_id,g.created_at
      from public.community_word_guesses g
    union all
    select 'plates',v.voter_id,v.created_at
      from public.community_plate_votes v
    union all
    select 'plates',e.author_id,e.created_at
      from public.community_plate_entries e
  ), approved_events as (
    select e.game,e.user_id,e.played_at,
      coalesce(nullif(m.display_name,''),'Family member') display_name
    from event_rows e
    join public.community_members m
      on m.user_id=e.user_id and m.status='approved'
    where e.played_at is not null
  ), counts as (
    select a.game,max(a.played_at) last_played_at,
       count(*) filter(where a.played_at >=
         (date_trunc('day',now() at time zone 'America/New_York')
          at time zone 'America/New_York')) activity_today,
       count(*) filter(where a.user_id=viewer and a.played_at >=
         (date_trunc('day',now() at time zone 'America/New_York')
          at time zone 'America/New_York')) mine_today,
       max(a.played_at) filter(where a.user_id=viewer) my_last_played_at
    from approved_events a group by a.game
  )
  select jsonb_build_object(
    'asOf',now(),
    'games',coalesce(jsonb_object_agg(c.game,jsonb_build_object(
      'lastPlayedAt',c.last_played_at,
      'lastPlayer',(
        select ae.display_name from approved_events ae
        where ae.game=c.game
        order by ae.played_at desc,ae.display_name asc limit 1
      ),
      'actionsToday',c.activity_today,
      'yourActionsToday',c.mine_today,
      'yourLastPlayedAt',c.my_last_played_at
    )),'{}'::jsonb))
  into result from counts c;
  return result;
end;
$function$;
revoke all on function public.community_family_arcade_activity() from public,anon;
grant execute on function public.community_family_arcade_activity() to authenticated;
