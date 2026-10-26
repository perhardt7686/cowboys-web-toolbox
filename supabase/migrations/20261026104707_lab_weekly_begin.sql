begin;
create function public.community_programs_begin(p_token text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare owner_id uuid;wk date:=(date_trunc('week',now() at time zone 'America/New_York'))::date;tid uuid;theme integer;ttl text;body_text text;
begin
  if p_token is null or char_length(p_token)<>64 then raise exception 'Invalid worker token' using errcode='22023';end if;
  update public.community_worker_capability set consumed_at=now() where id='weekly' and consumed_at is null and expires_at>now() and token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex');
  if not found then raise exception 'Worker token expired or used' using errcode='22023';end if;
  perform pg_advisory_xact_lock(2061026);
  select user_id into owner_id from public.community_members where role='owner' and status='approved' order by created_at limit 1;
  if owner_id is null then return jsonb_build_object('ok',false,'reason','owner_unavailable');end if;
  theme=mod((extract(epoch from wk::timestamp)::bigint/604800)::integer,4);
  ttl=case theme when 0 then 'Make a useful diagram in your browser' when 1 then 'Find the manual for something you own' when 2 then 'Make a small graphic with a toolbox tool' else 'Share a three-step workflow that saves time' end;
  body_text='Cowboy’s weekly challenge: '||lower(ttl)||'. Choose a tool from the collection, try a small task, and share the tool, steps and what worked. This is an owner community prompt, posted on a schedule. Participation is optional. Credit sources and keep personal information private.';
  insert into public.community_threads(author_id,author_name,title,body,category,post_kind,post_data,challenge_week,challenge_ends_at)
  values(owner_id,'Cowboy','Weekly challenge: '||ttl,body_text,case when theme=1 then 'repair' else 'creative' end,'challenge',jsonb_build_object('ownerPrompt',true),wk,(wk+7)::timestamp at time zone 'America/New_York')
  on conflict(challenge_week) do nothing returning id into tid;
  if tid is not null then insert into public.community_audit(actor_id,action,subject_id) values(owner_id,'challenge.scheduled',tid);end if;
  if not exists(select 1 from public.community_digest_jobs where week_start=wk) then
  insert into public.community_digest_jobs(user_id,week_start)
  select p.user_id,wk from public.community_preferences p join public.community_members m on m.user_id=p.user_id
  where p.digest_enabled and m.status='approved'
  order by (select max(j.finished_at) from public.community_digest_jobs j where j.user_id=p.user_id and j.status='sent') nulls first,p.user_id limit 20
  on conflict do nothing;
  end if;
  return jsonb_build_object('ok',true,'week',wk,'challengeCreated',tid is not null);
end $$;
revoke execute on function public.community_programs_begin(text) from public,anon,authenticated;
grant execute on function public.community_programs_begin(text) to service_role;
commit;
