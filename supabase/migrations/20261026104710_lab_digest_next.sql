begin;
create function public.community_digest_next(p_week date) returns jsonb language plpgsql security invoker set search_path='' as $$
declare job public.community_digest_jobs%rowtype;token text;items jsonb;
begin
  update public.community_digest_jobs j set status='skipped',finished_at=now() where week_start=p_week and status in ('pending','failed') and not exists(select 1 from public.community_preferences p join public.community_members m on m.user_id=p.user_id where p.user_id=j.user_id and p.digest_enabled and m.status='approved');
  select * into job from public.community_digest_jobs where week_start=p_week and (status='pending' or(status='failed' and attempts<2)) order by attempts,user_id for update skip locked limit 1;
  if job.user_id is null then return null;end if;
  select unsubscribe_token into token from public.community_preferences where user_id=job.user_id;
  if token is null then token=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');end if;
  update public.community_preferences set unsubscribe_token=token,unsubscribe_hash=encode(sha256(convert_to(token,'UTF8')),'hex') where user_id=job.user_id;
  update public.community_digest_jobs set status='sending',attempts=attempts+1,claimed_at=now() where user_id=job.user_id and week_start=p_week;
  select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into items from(select id,title,post_kind from public.community_threads where status='published' and created_at>now()-interval '7 days' order by (post_kind='challenge') desc,helpful_count desc,created_at desc limit 5)x;
  return jsonb_build_object('userId',job.user_id,'week',p_week,'unsubscribeToken',token,'threads',items);
end $$;
revoke execute on function public.community_digest_next(date) from public,anon,authenticated;
grant execute on function public.community_digest_next(date) to service_role;
commit;
