begin;
-- Ten reusable minute slots hold at most 2,400 random event IDs, never visitors.
-- The previously created private per-event table remains empty and unused.
alter table public.community_click_buckets
  add column slot smallint not null check(slot between 0 and 9),
  add column event_ids uuid[] not null default '{}' check(coalesce(array_length(event_ids,1),0)<=240),
  add constraint community_click_slot unique(slot);
create function public.community_record_click(p_site_id text,p_event_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare count_now bigint;allowed integer;minute_now timestamptz=date_trunc('minute',now());
  slot_now smallint=(floor(extract(epoch from now())/60)::bigint % 10)::smallint;
  day_now date=(now() at time zone 'America/New_York')::date;
begin
  perform pg_catalog.pg_advisory_xact_lock(2061025);
  select clicks into count_now from public.community_site_totals where site_id=p_site_id for update;
  if not found then raise exception 'Unknown catalog website'; end if;
  if p_event_id is null then raise exception 'Event ID required'; end if;
  if exists(select 1 from public.community_click_buckets where window_start>now()-interval '10 minutes' and p_event_id=any(event_ids)) then
    return jsonb_build_object('recorded',false,'clicks',count_now,'reason','duplicate');
  end if;
  insert into public.community_click_buckets(window_start,attempts,slot,event_ids) values(minute_now,1,slot_now,array[p_event_id])
    on conflict(slot) do update set
      window_start=excluded.window_start,
      attempts=case when public.community_click_buckets.window_start=excluded.window_start then public.community_click_buckets.attempts+1 else 1 end,
      event_ids=case when public.community_click_buckets.window_start=excluded.window_start then array_append(public.community_click_buckets.event_ids,p_event_id) else array[p_event_id] end
    where public.community_click_buckets.window_start<>excluded.window_start or public.community_click_buckets.attempts<240
    returning attempts into allowed;
  if allowed is null then return jsonb_build_object('recorded',false,'clicks',count_now,'reason','rate_limited'); end if;
  update public.community_site_totals set clicks=clicks+1,last_clicked_at=now() where site_id=p_site_id returning clicks into count_now;
  insert into public.community_daily_clicks(day,site_id,clicks) values(day_now,p_site_id,1)
    on conflict(day,site_id) do update set clicks=public.community_daily_clicks.clicks+1;
  return jsonb_build_object('recorded',true,'clicks',count_now);
end;$$;
revoke all on function public.community_record_click(text,uuid) from public,anon,authenticated;
grant execute on function public.community_record_click(text,uuid) to service_role;
commit;
