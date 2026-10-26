begin;
create function public.community_lab_thread_event() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if TG_OP<>'INSERT' then perform public.community_refresh_site(old.site_id);end if;
  if TG_OP<>'DELETE' then perform public.community_refresh_site(new.site_id);end if;
  return null;
end $$;
create trigger community_lab_thread_refresh after insert or update or delete on public.community_threads for each row execute function public.community_lab_thread_event();
revoke execute on function public.community_lab_thread_event() from public,anon,authenticated;
grant execute on function public.community_lab_thread_event() to service_role;
commit;
