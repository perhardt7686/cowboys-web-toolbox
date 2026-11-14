begin;

-- Publish only monotonic revision markers, with no family record contents.
-- Existing game and family tables remain outside the Realtime publication.
create table public.community_family_revisions (
  topic text primary key check (topic in ('scores', 'fridge', 'calendar')),
  revision bigint not null default 0,
  changed_at timestamptz not null default now()
);
insert into public.community_family_revisions(topic) values ('scores'), ('fridge'), ('calendar');
alter table public.community_family_revisions enable row level security;
revoke all on public.community_family_revisions from public, anon, authenticated;
grant select on public.community_family_revisions to authenticated;
create policy approved_family_revisions on public.community_family_revisions for select to authenticated using (
  (select exists (
    select 1 from public.community_members
    where user_id = (select auth.uid()) and status = 'approved'
  ))
);
alter publication supabase_realtime add table public.community_family_revisions;
drop policy approved_family_updates on realtime.messages;

create or replace function community_private.signal_family_update() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from changed_rows) then
    update public.community_family_revisions
    set revision = revision + 1, changed_at = clock_timestamp()
    where topic = tg_argv[0];
  end if;
  return null;
end;
$$;

commit;
