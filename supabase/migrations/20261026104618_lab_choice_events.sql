begin;
create function public.community_lab_choice_event() returns trigger language plpgsql security invoker set search_path='' as $$
declare tid uuid:=coalesce(new.thread_id,old.thread_id);options jsonb;
begin
  select post_data->'options' into options from public.community_threads where id=tid;
  update public.community_threads set helpful_count=(select count(*) from public.community_choices where thread_id=tid and helpful),
    poll_counts=coalesce((select jsonb_agg((select count(*) from public.community_choices where thread_id=tid and poll_choice=i)) from generate_series(0,coalesce(jsonb_array_length(options),0)-1) g(i)),'[]'::jsonb)
  where id=tid;
  return null;
end $$;
create trigger community_lab_choice_refresh after insert or update or delete on public.community_choices for each row execute function public.community_lab_choice_event();
revoke execute on function public.community_refresh_site(text),public.community_lab_thread_event(),public.community_lab_reply_event(),public.community_lab_choice_event() from public,anon,authenticated;
grant execute on function public.community_refresh_site(text),public.community_lab_thread_event(),public.community_lab_reply_event(),public.community_lab_choice_event() to service_role;
update public.community_threads t set human_reply_count=(select count(*) from public.community_replies r where r.thread_id=t.id and r.status='published' and r.author_kind='member');
revoke execute on function public.community_lab_choice_event() from public,anon,authenticated;
grant execute on function public.community_lab_choice_event() to service_role;
commit;
