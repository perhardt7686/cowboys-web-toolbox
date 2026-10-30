begin;
create table public.community_discovery_totals(day date not null,metric text not null,bucket text not null,events integer not null default 0 check(events between 0 and 20000),primary key(day,metric,bucket),check((metric='search' and bucket in ('results','zero'))or(metric='open' and bucket in ('under10','10to29','30to59','60plus'))or(metric='task' and bucket in ('yes','no'))));
create table public.community_discovery_events(event_id uuid primary key,created_at timestamptz not null default now());
create index community_discovery_retention on public.community_discovery_events(created_at);
alter table public.community_discovery_totals enable row level security;
alter table public.community_discovery_events enable row level security;
revoke all on public.community_discovery_totals,public.community_discovery_events from public,anon,authenticated;
grant all on public.community_discovery_totals,public.community_discovery_events to service_role;
create function public.community_record_discovery(p_metric text,p_bucket text,p_event_id uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare day_now date=(now() at time zone 'America/New_York')::date; inserted integer;
begin
 if p_metric is null or p_bucket is null or p_event_id is null or not((p_metric='search' and p_bucket in ('results','zero'))or(p_metric='open' and p_bucket in ('under10','10to29','30to59','60plus'))or(p_metric='task' and p_bucket in ('yes','no')))then raise exception 'Invalid discovery event';end if;
 perform pg_catalog.pg_advisory_xact_lock(2061030);
 delete from public.community_discovery_events where created_at<now()-interval '24 hours';
 delete from public.community_discovery_totals where day<day_now-90;
 if(select coalesce(sum(events),0)from public.community_discovery_totals where day=day_now)>=20000 then return jsonb_build_object('recorded',false,'reason','daily_cap');end if;
 insert into public.community_discovery_events(event_id)values(p_event_id)on conflict do nothing;get diagnostics inserted=row_count;
 if inserted=0 then return jsonb_build_object('recorded',false,'reason','duplicate');end if;
 insert into public.community_discovery_totals(day,metric,bucket,events)values(day_now,p_metric,p_bucket,1)on conflict(day,metric,bucket)do update set events=public.community_discovery_totals.events+1;
 return jsonb_build_object('recorded',true);
end;$$;
revoke all on function public.community_record_discovery(text,text,uuid)from public,anon,authenticated;
grant execute on function public.community_record_discovery(text,text,uuid)to service_role;
create function public.community_discovery_overview()returns jsonb language sql stable security invoker set search_path='' as $$select jsonb_build_object('days',30,'timezone','America/New_York','rows',coalesce(jsonb_agg(to_jsonb(d)order by d.day,d.metric,d.bucket),'[]'::jsonb))from(select day,metric,bucket,events from public.community_discovery_totals where day>=(now()at time zone 'America/New_York')::date-29)d;$$;
revoke all on function public.community_discovery_overview()from public,anon,authenticated;
grant execute on function public.community_discovery_overview()to service_role;
commit;
