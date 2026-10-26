begin;
create function public.community_hub_mutate(p_actor uuid,p_action text,p_data jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare m public.community_members%rowtype;tr public.community_threads%rowtype;rep public.community_replies%rowtype;tid uuid;rid uuid;field text;flag boolean;idx integer;sid text;report_id uuid;reason text;token text;
begin
  select * into m from public.community_members where user_id=p_actor;
  if m.user_id is null or m.status<>'approved' then raise exception 'Approved posting access required' using errcode='22023';end if;
  perform pg_advisory_xact_lock(hashtext(p_actor::text));
  if not public.community_claim_action('hub:'||p_actor::text,60,40) then raise exception 'Please wait before trying again' using errcode='22023';end if;
  if p_action='digest' then
    if jsonb_typeof(p_data->'enabled') is distinct from 'boolean' then raise exception 'Choose a digest preference' using errcode='22023';end if;
    insert into public.community_preferences(user_id,digest_enabled,digest_opted_at) values(p_actor,(p_data->>'enabled')::boolean,case when (p_data->>'enabled')::boolean then now() else null end)
    on conflict(user_id) do update set digest_enabled=excluded.digest_enabled,digest_opted_at=excluded.digest_opted_at,unsubscribe_hash=case when community_preferences.digest_enabled is distinct from excluded.digest_enabled then null else community_preferences.unsubscribe_hash end,unsubscribe_token=case when community_preferences.digest_enabled is distinct from excluded.digest_enabled then null else community_preferences.unsubscribe_token end,updated_at=now();
    return jsonb_build_object('digestEnabled',(p_data->>'enabled')::boolean);
  end if;
  if p_action='notification_read' then
    update public.community_notifications set unread=false where user_id=p_actor and (p_data->>'threadId' is null or thread_id=(p_data->>'threadId')::uuid);
    return jsonb_build_object('updated',true);
  end if;
  if p_action='site_report' then
    sid=p_data->>'siteId';reason=p_data->>'reason';
    if not exists(select 1 from public.community_site_totals where site_id=sid) or reason not in ('broken','price','signup','misleading','other') or char_length(coalesce(p_data->>'details','')) not between 5 and 2000 then raise exception 'Choose a site, reason and a little context' using errcode='22023';end if;
    if not public.community_claim_action('site-report:'||p_actor::text,3600,3) then raise exception 'Please wait before another report' using errcode='22023';end if;
    insert into public.community_site_reports(reporter_id,site_id,reason,details) values(p_actor,sid,reason,p_data->>'details') returning id into report_id;
    return jsonb_build_object('recorded',true,'id',report_id);
  end if;
  tid=(p_data->>'threadId')::uuid;
  select * into tr from public.community_threads where id=tid and status='published' for update;
  if tr.id is null then raise exception 'Conversation unavailable' using errcode='22023';end if;
  if p_action in ('helpful','following','saved','poll_vote') then
    if p_action='poll_vote' then
      idx=(p_data->>'choice')::integer;
      if tr.post_kind<>'poll' or tr.locked or idx is null or idx<0 or idx>=jsonb_array_length(tr.post_data->'options') then raise exception 'Choose an available poll option' using errcode='22023';end if;
      insert into public.community_choices(user_id,thread_id,poll_choice) values(p_actor,tid,idx) on conflict(user_id,thread_id) do update set poll_choice=excluded.poll_choice,updated_at=now();
    else
      if jsonb_typeof(p_data->'enabled') is distinct from 'boolean' then raise exception 'Choose a valid preference' using errcode='22023';end if;
      flag=(p_data->>'enabled')::boolean;
      if p_action='helpful' and tr.author_id=p_actor then raise exception 'You cannot vote for your own conversation' using errcode='22023';end if;
      if p_action in ('following','saved') and flag and (select count(*) from public.community_choices where user_id=p_actor and (following or saved))>=200 and not exists(select 1 from public.community_choices where user_id=p_actor and thread_id=tid and (following or saved)) then raise exception 'Keep up to 200 saved or followed conversations' using errcode='22023';end if;
      insert into public.community_choices(user_id,thread_id) values(p_actor,tid) on conflict do nothing;
      if p_action='helpful' then update public.community_choices set helpful=flag,updated_at=now() where user_id=p_actor and thread_id=tid;
      elsif p_action='following' then update public.community_choices set following=flag,updated_at=now() where user_id=p_actor and thread_id=tid;
      else update public.community_choices set saved=flag,updated_at=now() where user_id=p_actor and thread_id=tid;end if;
    end if;
    return jsonb_build_object('updated',true);
  end if;
  if p_action='accept_answer' then
    if tr.post_kind<>'request' or (tr.author_id is distinct from p_actor and m.role<>'owner') then raise exception 'Only the question author or owner can mark an answer' using errcode='22023';end if;
    rid=nullif(p_data->>'replyId','')::uuid;
    if rid is not null then
      select * into rep from public.community_replies where id=rid and thread_id=tid and status='published';
      if rep.id is null or rep.author_kind<>'member' or rep.author_id is null then raise exception 'Choose a published member answer' using errcode='22023';end if;
    end if;
    update public.community_threads set accepted_reply_id=rid where id=tid;
    update public.community_badges set active=false where thread_id=tid and badge='Helpful Hand';
    if rid is not null and rep.author_id is distinct from tr.author_id then insert into public.community_badges(user_id,badge,thread_id,reason) values(rep.author_id,'Helpful Hand',tid,'An answer accepted by the question author or Cowboy.') on conflict(user_id,badge,thread_id) do update set active=true;end if;
    insert into public.community_audit(actor_id,action,subject_id,details) values(p_actor,'answer.accepted',tid,jsonb_build_object('reply_id',rid));
    return jsonb_build_object('acceptedReplyId',rid);
  end if;
  raise exception 'Unknown community action' using errcode='22023';
end $$;
revoke execute on function public.community_hub_mutate(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.community_hub_mutate(uuid,text,jsonb) to service_role;
commit;
