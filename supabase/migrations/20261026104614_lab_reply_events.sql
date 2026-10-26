begin;
create function public.community_lab_reply_event() returns trigger language plpgsql security invoker set search_path='' as $$
declare tid uuid:=coalesce(new.thread_id,old.thread_id);tr public.community_threads%rowtype;
begin
  update public.community_threads set human_reply_count=(select count(*) from public.community_replies where thread_id=tid and status='published' and author_kind='member') where id=tid;
  select * into tr from public.community_threads where id=tid;
  if tr.accepted_reply_id is not null and not exists(select 1 from public.community_replies where id=tr.accepted_reply_id and thread_id=tid and status='published') then
    update public.community_threads set accepted_reply_id=null where id=tid;
    update public.community_badges set active=false where thread_id=tid and badge='Helpful Hand';
  end if;
  if TG_OP<>'DELETE' and new.status='published' and tr.status='published' and (TG_OP='INSERT' or old.status<>'published') then
    insert into public.community_notifications(user_id,thread_id,title,last_reply_id)
    select c.user_id,tid,tr.title,new.id from public.community_choices c join public.community_members m on m.user_id=c.user_id
    where c.thread_id=tid and c.following and m.status='approved' and c.user_id is distinct from new.author_id
    on conflict(user_id,thread_id) do update set title=excluded.title,last_reply_id=excluded.last_reply_id,unread=true,updated_at=now();
  end if;
  perform public.community_refresh_site(tr.site_id);
  return null;
end $$;
create trigger community_lab_reply_refresh after insert or update or delete on public.community_replies for each row execute function public.community_lab_reply_event();
revoke execute on function public.community_lab_reply_event() from public,anon,authenticated;
grant execute on function public.community_lab_reply_event() to service_role;
commit;
