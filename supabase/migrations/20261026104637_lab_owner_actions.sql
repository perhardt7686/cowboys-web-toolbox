begin;
create function public.community_hub_owner(p_actor uuid,p_action text,p_data jsonb default '{}') returns jsonb language plpgsql security invoker set search_path='' as $$
declare tr public.community_threads%rowtype;sid text;decision text;candidate_name text;candidate_url text;candidate_host text;candidate_description text;candidate_category text;candidate_credit text;
begin
  if not exists(select 1 from public.community_members where user_id=p_actor and role='owner' and status='approved') then raise exception 'Owner required' using errcode='22023';end if;
  if p_action='overview' then return jsonb_build_object(
    'discoveries',coalesce((select jsonb_agg(to_jsonb(x)) from(select id,title,author_name,post_data,discovery_status,reviewed_site_id from public.community_threads where status='published' and post_kind='discovery' order by created_at desc limit 50)x),'[]'::jsonb),
    'reports',coalesce((select jsonb_agg(to_jsonb(x)) from(select * from public.community_site_reports where status='open' order by created_at limit 50)x),'[]'::jsonb),
    'projects',coalesce((select jsonb_agg(to_jsonb(x)) from(select id,title,author_name,featured from public.community_threads where status='published' and post_kind='project' order by created_at desc limit 30)x),'[]'::jsonb),
    'digestSubscribers',(select count(*) from public.community_preferences p join public.community_members m on m.user_id=p.user_id where p.digest_enabled and m.status='approved')
  );end if;
  if p_data->>'confirm' is distinct from 'true' then raise exception 'Confirm the owner change' using errcode='22023';end if;
  if p_action='resolve_site_report' then
    update public.community_site_reports set status='resolved',resolved_at=now() where id=(p_data->>'id')::uuid and status='open';
    if not found then raise exception 'Report unavailable' using errcode='22023';end if;
    insert into public.community_audit(actor_id,action,subject_id) values(p_actor,'site-report.resolved',(p_data->>'id')::uuid);
    return jsonb_build_object('updated',true);
  end if;
  select * into tr from public.community_threads where id=(p_data->>'threadId')::uuid and status='published' for update;
  if tr.id is null then raise exception 'Conversation unavailable' using errcode='22023';end if;
  if p_action='feature_project' then
    if tr.post_kind<>'project' or jsonb_typeof(p_data->'enabled') is distinct from 'boolean' then raise exception 'Choose a project' using errcode='22023';end if;
    update public.community_threads set featured=(p_data->>'enabled')::boolean where id=tr.id;
    if (p_data->>'enabled')::boolean and tr.author_id is not null then insert into public.community_badges(user_id,badge,thread_id,reason) values(tr.author_id,'Maker',tr.id,'A project featured by Cowboy.') on conflict(user_id,badge,thread_id) do update set active=true;
    else update public.community_badges set active=false where thread_id=tr.id and badge='Maker';end if;
  elsif p_action='review_discovery' then
    decision=p_data->>'status';if tr.post_kind<>'discovery' or decision not in ('reviewing','added','needs-check') then raise exception 'Choose a discovery status' using errcode='22023';end if;
    if decision='added' then
      sid=nullif(p_data->>'existingSiteId','');
      if sid is null then
        sid='find-'||tr.id::text;candidate_name=p_data->>'name';candidate_url=p_data->>'url';candidate_host=p_data->>'host';candidate_description=p_data->>'description';candidate_category=p_data->>'category';
        if candidate_url is distinct from tr.post_data->>'url' or candidate_host is null or candidate_host !~ '^[a-z0-9.-]+$' or char_length(candidate_name) not between 2 and 80 or char_length(candidate_description) not between 12 and 240 or candidate_url !~ '^https://[^/@[:space:]]+' then raise exception 'Use the validated official website details' using errcode='22023';end if;
        candidate_credit=case when tr.post_data->>'credit'='true' then tr.author_name else null end;
        insert into public.community_site_totals(site_id) values(sid) on conflict do nothing;
        insert into public.community_catalog_additions(id,name,url,canonical_host,category,description,source_thread_id,credit_name) values(sid,candidate_name,candidate_url,candidate_host,candidate_category,candidate_description,tr.id,candidate_credit) on conflict(source_thread_id) do update set published=true;
      elsif not exists(select 1 from public.community_site_totals where site_id=sid) then raise exception 'Choose an existing catalog entry' using errcode='22023';end if;
      update public.community_threads set reviewed_site_id=sid where id=tr.id;
      if tr.author_id is not null and tr.post_data->>'credit'='true' then insert into public.community_badges(user_id,badge,thread_id,reason) values(tr.author_id,'Trail Finder',tr.id,'A credited discovery added to the toolbox by Cowboy.') on conflict(user_id,badge,thread_id) do update set active=true;end if;
    else
      update public.community_catalog_additions set published=false where source_thread_id=tr.id;
      update public.community_badges set active=false where thread_id=tr.id and badge='Trail Finder';
    end if;
    update public.community_threads set discovery_status=decision where id=tr.id;
  else raise exception 'Unknown owner action' using errcode='22023';end if;
  insert into public.community_audit(actor_id,action,subject_id,details) values(p_actor,'hub.'||p_action,tr.id,p_data-'url');
  return jsonb_build_object('updated',true,'siteId',sid);
end $$;
revoke execute on function public.community_create_lab_thread(uuid,jsonb),public.community_hub_state(uuid),public.community_hub_mutate(uuid,text,jsonb),public.community_hub_owner(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.community_create_lab_thread(uuid,jsonb),public.community_hub_state(uuid),public.community_hub_mutate(uuid,text,jsonb),public.community_hub_owner(uuid,text,jsonb) to service_role;
revoke execute on function public.community_hub_owner(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.community_hub_owner(uuid,text,jsonb) to service_role;
commit;
