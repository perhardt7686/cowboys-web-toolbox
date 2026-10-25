-- Scheduled replies are privileged, disclosed and idempotent per human message.
create table public.community_moderator_receipts (
  source_id uuid primary key,
  thread_id uuid not null references public.community_threads(id) on delete cascade,
  reply_id uuid references public.community_replies(id) on delete set null,
  created_at timestamptz not null default now()
);
create index community_moderator_receipts_thread on public.community_moderator_receipts(thread_id);
create index community_moderator_receipts_reply on public.community_moderator_receipts(reply_id);
alter table public.community_moderator_receipts enable row level security;
revoke all on public.community_moderator_receipts from public,anon,authenticated;
grant all on public.community_moderator_receipts to service_role;

create function public.community_moderator_reply(p_thread_id uuid,p_source_id uuid,p_body text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  thread_record public.community_threads%rowtype;
  source_time timestamptz;
  inserted_source uuid;
  new_reply uuid;
begin
  if p_body is null or char_length(btrim(p_body)) not between 2 and 6000 then
    raise exception 'Reply must contain 2 to 6000 characters';
  end if;
  if p_body ~* '(sb_secret_[A-Za-z0-9_-]{15}|-----BEGIN[^\n]*PRIVATE KEY|Authorization:[[:space:]]*Bearer[[:space:]]+[A-Za-z0-9_.-]{20})' then
    raise exception 'Private credentials are not allowed in a public reply';
  end if;
  select * into thread_record from public.community_threads
    where id=p_thread_id and status='published' and not locked for update;
  if not found then return jsonb_build_object('status','skipped','reason','thread_unavailable'); end if;
  if p_source_id=p_thread_id then source_time=thread_record.created_at;
  else
    select created_at into source_time from public.community_replies
      where id=p_source_id and thread_id=p_thread_id and status='published' and author_kind='member';
    if not found then return jsonb_build_object('status','skipped','reason','human_source_unavailable'); end if;
  end if;
  if exists(select 1 from public.community_moderator_receipts where source_id=p_source_id)
     or exists(select 1 from public.community_replies where thread_id=p_thread_id and status='published' and author_kind='edward' and created_at>=source_time) then
    return jsonb_build_object('status','skipped','reason','already_answered');
  end if;
  if not public.community_claim_action('edward:scheduled',21600,3) then
    return jsonb_build_object('status','skipped','reason','rate_limited');
  end if;
  insert into public.community_moderator_receipts(source_id,thread_id)
    values(p_source_id,p_thread_id) on conflict do nothing returning source_id into inserted_source;
  if inserted_source is null then return jsonb_build_object('status','skipped','reason','already_answered'); end if;
  insert into public.community_replies(thread_id,author_id,author_name,author_kind,body,status)
    values(p_thread_id,null,'Edward','edward',btrim(p_body),'published') returning id into new_reply;
  update public.community_moderator_receipts set reply_id=new_reply where source_id=p_source_id;
  insert into public.community_audit(actor_id,action,subject_id,details)
    values(null,'edward.scheduled_reply',p_source_id,jsonb_build_object('thread_id',p_thread_id,'reply_id',new_reply));
  return jsonb_build_object('status','created','reply_id',new_reply);
end;
$$;
revoke all on function public.community_moderator_reply(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.community_moderator_reply(uuid,uuid,text) to service_role;
