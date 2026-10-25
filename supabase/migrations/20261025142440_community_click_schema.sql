begin;
create table public.community_site_totals(site_id text primary key check(site_id ~ '^[a-z0-9-]{1,80}$'),clicks bigint not null default 0 check(clicks>=0),last_clicked_at timestamptz);
create table public.community_daily_clicks(day date not null,site_id text not null references public.community_site_totals(site_id),clicks bigint not null default 0 check(clicks>=0),primary key(day,site_id));
create index community_daily_clicks_site on public.community_daily_clicks(site_id,day);
create table public.community_click_events(event_id uuid primary key,site_id text not null references public.community_site_totals(site_id),created_at timestamptz not null default now());
create index community_click_events_created on public.community_click_events(created_at);
create index community_click_events_site on public.community_click_events(site_id);
create table public.community_click_buckets(window_start timestamptz primary key,attempts integer not null default 1);
alter table public.community_site_totals enable row level security;alter table public.community_daily_clicks enable row level security;
alter table public.community_click_events enable row level security;alter table public.community_click_buckets enable row level security;
create policy public_click_totals on public.community_site_totals for select to anon,authenticated using(true);
create policy public_daily_clicks on public.community_daily_clicks for select to anon,authenticated using(true);
revoke all on public.community_site_totals,public.community_daily_clicks,public.community_click_events,public.community_click_buckets from public,anon,authenticated;
grant select on public.community_site_totals,public.community_daily_clicks to anon,authenticated;
grant all on public.community_site_totals,public.community_daily_clicks,public.community_click_events,public.community_click_buckets to service_role;
-- Catalog IDs are seeded below; the event endpoint also validates the catalog.
insert into public.community_site_totals(site_id) values ('fmhy'),('123apps'),('netflixcodes'),('hotpot'),('playphrase'),('innerbody'),('retrogames'),('windows93'),('chattjb'),('nosignups'),('excalidraw'),('opencut'),('keepa'),('messenger'),('animated'),('drivefun'),('zperiod'),('ninite'),('archive'),('wifiqr'),('osiris'),('ifixit'),('carcare'),('rockauto'),('startmycar'),('recoded'),('electude'),('bingebrowse'),('paper-animators'),('thaumaturgy'),('artcraft-apps'),('apex-drawn'),('mcstumble-fake-update'),('quenq'),('vocalcut'),('d-r-cos'),('r-pumpkinstencils'),('3dsvg'),('entertrained'),('homebyme'),('sprite-fusion-destroy-any-website'),('kadoa-congress'),('terraprinter'),('leolabs-orbit-visualization'),('ztype'),('spaceplanner'),('chronas'),('nuke-simulation'),('harvard-mcs-r-sum-resources'),('cooked-wiki'),('timemap'),('goblin-tools-magic-todo'),('simplepdf'),('repair-clinic'),('mecabricks'),('3dtuning'),('freesewing'),('musclewiki'),('car-part-com'),('chatgpt'),('god-s-eye-view-source-project'),('pinokio'),('famelack'),('retrocrush'),('fawesome'),('google-my-activity'),('mcstumble-mp4-to-gif-converter'),('google-earth'),('sponsorblock');
commit;
