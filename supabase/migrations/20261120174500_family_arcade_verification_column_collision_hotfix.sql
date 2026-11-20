-- Restore server-verified results for BOTH original family arcade games.
-- Production Mystery Maze test (2026-11-20) failed:
--   column reference "steps" is ambiguous
-- PL/pgSQL variables collided with table columns on UPDATE. The trophy
-- SELECT also had a latent variable / column collision. Qualify both.
-- No score arithmetic, rules, timings, membership checks or RLS are altered.
create or replace function public.community_retro_finish(p_run_id uuid,p_actions text)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare uid uuid:=auth.uid();r public.community_retro_runs%rowtype;
 outcome jsonb;points integer;survivors integer;v_steps integer;cleared boolean;
 ms double precision;win integer;cap integer;v_trophy text;v_threshold integer;
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
 v_steps:=(outcome->>'steps')::integer;cleared:=(outcome->>'cleared')::boolean;
 update public.community_retro_runs set actions=p_actions,
  finished_at=now(),status='finished',score=points,lives=survivors,steps=v_steps
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
 for v_trophy,v_threshold in select * from (values
  ('first-run'::text,0),
  ('bronze'::text,case when r.game='fleet' then 60 else 100 end),
  ('silver'::text,case when r.game='fleet' then 200 else 250 end),
  ('gold'::text,case when r.game='fleet' then 400 else 450 end),
  ('legendary'::text,case when r.game='fleet' then 650 else 700 end)
 ) as goals(trophy,threshold) loop
   if points>=v_threshold then
     insert into public.community_retro_trophies(user_id,game,trophy,score)
       values(uid,r.game,v_trophy,points)
       on conflict(user_id,game,trophy) do nothing;
   end if;
 end loop;
 perform community_private.avatar_reward_award(uid,community_private.avatar_reward_metrics(uid));
 return outcome||jsonb_build_object('trophies',
   (select coalesce(jsonb_agg(rt.trophy order by
     case rt.trophy when 'first-run' then 0 when 'bronze' then 1 when 'silver' then 2
     when 'gold' then 3 else 4 end),'[]'::jsonb)
     from public.community_retro_trophies rt
     where rt.user_id=uid and rt.game=r.game));
end;
$fn$;
-- This SECURITY DEFINER RPC is owner/member gated within its body.
-- Do not permit direct anonymous EXECUTE even if its guard rejects it.
revoke all on function public.community_retro_finish(uuid,text) from public, anon;
grant execute on function public.community_retro_finish(uuid,text) to authenticated;
