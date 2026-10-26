begin;
create extension if not exists pg_net with schema extensions;
create function public.community_dispatch_weekly() returns jsonb language plpgsql security invoker set search_path='' as $$
declare token text;request_id bigint;
begin
  perform pg_advisory_xact_lock(2061027);
  if exists(select 1 from public.community_worker_capability where id='weekly' and expires_at>now() and consumed_at is null) then return jsonb_build_object('queued',false,'reason','already_queued');end if;
  if not public.community_claim_action('programs:dispatch',3600,8) then return jsonb_build_object('queued',false,'reason','hourly_limit');end if;
  token=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
  insert into public.community_worker_capability(id,token_hash,expires_at,consumed_at) values('weekly',encode(sha256(convert_to(token,'UTF8')),'hex'),now()+interval '10 minutes',null)
  on conflict(id) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,consumed_at=null;
  select net.http_post(url:='https://twecuqwetzfweljoxbty.supabase.co/functions/v1/community-programs',
    headers:=jsonb_build_object('Content-Type','application/json','apikey','sb_publishable_u7HeFIVkPUjzbx2_OLW3Ow_ZBwwBEK-'),
    body:=jsonb_build_object('action','run','token',token),timeout_milliseconds:=60000) into request_id;
  return jsonb_build_object('queued',true,'requestId',request_id);
end $$;
revoke execute on function public.community_dispatch_weekly() from public,anon,authenticated;
grant execute on function public.community_dispatch_weekly() to service_role;
insert into public.community_site_totals(site_id) values ('fmhy'),('123apps'),('netflixcodes'),('hotpot'),('playphrase'),('innerbody'),('retrogames'),('windows93'),('chattjb'),('nosignups'),('excalidraw'),('opencut'),('keepa'),('messenger'),('animated'),('drivefun'),('zperiod'),('ninite'),('archive'),('wifiqr'),('osiris'),('ifixit'),('carcare'),('rockauto'),('startmycar'),('recoded'),('electude'),('bingebrowse'),('paper-animators'),('thaumaturgy'),('artcraft-apps'),('apex-drawn'),('mcstumble-fake-update'),('quenq'),('vocalcut'),('d-r-cos'),('r-pumpkinstencils'),('3dsvg'),('entertrained'),('homebyme'),('sprite-fusion-destroy-any-website'),('kadoa-congress'),('terraprinter'),('leolabs-orbit-visualization'),('ztype'),('spaceplanner'),('chronas'),('nuke-simulation'),('harvard-mcs-r-sum-resources'),('cooked-wiki'),('timemap'),('goblin-tools-magic-todo'),('simplepdf'),('repair-clinic'),('mecabricks'),('3dtuning'),('freesewing'),('musclewiki'),('car-part-com'),('chatgpt'),('god-s-eye-view-source-project'),('pinokio'),('famelack'),('retrocrush'),('fawesome'),('google-my-activity'),('mcstumble-mp4-to-gif-converter'),('google-earth'),('sponsorblock'),('squoosh'),('photopea'),('pairdrop'),('manualslib'),('pdf24'),('omni-calculator'),('phet'),('justwatch'),('supercook'),('alternativeto'),('have-i-been-pwned'),('down-for-everyone'),('ezgif'),('openverse'),('google-fonts'),('svg-repo'),('coolors'),('openstax'),('instructables'),('fuel-economy'),('suncalc'),('windy'),('radio-garden'),('neal-fun'),('windowswap') on conflict(site_id) do nothing;
insert into public.community_site_activity(site_id) select site_id from public.community_site_totals on conflict(site_id) do nothing;
revoke execute on function public.community_dispatch_weekly() from public,anon,authenticated;
grant execute on function public.community_dispatch_weekly() to service_role;
commit;
