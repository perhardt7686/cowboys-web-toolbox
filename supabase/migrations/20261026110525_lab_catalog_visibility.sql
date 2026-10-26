begin;
alter policy additions_public on public.community_catalog_additions using(published and exists(select 1 from public.community_threads t where t.id=community_catalog_additions.source_thread_id and t.status='published'));
create or replace function public.community_lab_thread_event() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if TG_OP<>'INSERT' then perform public.community_refresh_site(old.site_id);end if;
  if TG_OP<>'DELETE' then
    perform public.community_refresh_site(new.site_id);
    if new.status<>'published' then
      update public.community_catalog_additions set published=false where source_thread_id=new.id;
      update public.community_badges set active=false where thread_id=new.id and badge='Trail Finder';
    end if;
  end if;
  return null;
end $$;
revoke execute on function public.community_lab_thread_event() from public,anon,authenticated;
grant execute on function public.community_lab_thread_event() to service_role;
commit;
