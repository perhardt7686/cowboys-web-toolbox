begin;

create policy approved_family_updates on realtime.messages
for select to authenticated
using (
  realtime.topic() = 'family-board-updates'
  and extension = 'broadcast'
  and (select exists (
    select 1 from public.community_members
    where user_id = (select auth.uid()) and status = 'approved'
  ))
);

create function community_private.signal_family_update() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- Only the invalidation category leaves the write transaction. Clients
  -- obtain fresh records by calling the independently authorized RPCs.
  if exists (select 1 from changed_rows) then
    perform realtime.send(jsonb_build_object('topic', tg_argv[0]), 'changed', 'family-board-updates', true);
  end if;
  return null;
end;
$$;
revoke all on function community_private.signal_family_update() from public, anon, authenticated;

do $$
declare source record;
begin
  for source in select * from (values
    ('community_mahjong_stats','scores'), ('community_mahjong_campaign','scores'),
    ('community_wordle_scores','scores'), ('community_word_scores','scores'),
    ('community_wordle_guesses','scores'), ('community_plate_entries','scores'),
    ('community_plate_players','scores'), ('community_family_fridge_items','fridge'),
    ('community_family_calendar_events','calendar')
  ) as sources(relation, topic) loop
    execute format('create trigger signal_family_insert after insert on public.%I referencing new table as changed_rows for each statement execute function community_private.signal_family_update(%L)', source.relation, source.topic);
    execute format('create trigger signal_family_change after update on public.%I referencing new table as changed_rows for each statement execute function community_private.signal_family_update(%L)', source.relation, source.topic);
    execute format('create trigger signal_family_delete after delete on public.%I referencing old table as changed_rows for each statement execute function community_private.signal_family_update(%L)', source.relation, source.topic);
  end loop;
end;
$$;

create function public.community_family_scoreboard() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  eastern_date date := (now() at time zone 'America/New_York')::date;
  scores jsonb;
  quest_xp bigint;
begin
  if viewer is null or not exists (
    select 1 from public.community_members where user_id = viewer and status = 'approved'
  ) then raise exception 'Approved family membership required' using errcode = '42501'; end if;

  with plate_players as (
    select p.user_id, p.starting_points, count(e.id) as approved_count
    from public.community_plate_players p
    left join public.community_plate_entries e on e.author_id = p.user_id and e.status = 'approved'
    where exists (select 1 from public.community_plate_players where user_id = viewer)
    group by p.user_id, p.starting_points
  ), raw as (
    select 'mahjong' as game, s.user_id, s.best_score::bigint as score, s.wins::bigint as achievement,
      s.total_pairs > 0 or s.wins > 0 as participated
    from public.community_mahjong_stats s
    union all
    select 'wordle', s.user_id, s.total_points, s.solves, s.games_played > 0 or s.total_points > 0
    from public.community_wordle_scores s
    union all
    select 'wordquest', s.user_id, s.total_points, s.solved_words, s.total_points > 0 or s.team_wins > 0
    from public.community_word_scores s
    union all
    select 'plates', p.user_id, p.starting_points + p.approved_count, p.approved_count, p.approved_count > 0
    from plate_players p
  ), ranked as (
    select r.*, m.display_name,
      case when p.avatar_mode = 'photo' then p.avatar_path end as avatar_path,
      case when p.avatar_mode = 'icon' then p.avatar_icon end as avatar_icon,
      dense_rank() over (partition by r.game order by r.score desc) as rank
    from raw r
    join public.community_members m on m.user_id = r.user_id and m.status = 'approved'
    left join public.community_profiles p on p.user_id = r.user_id and p.account_active
      and (p.published or p.user_id = viewer)
    where r.game = 'plates' or r.participated
  ), by_game as (
    select game, jsonb_build_object(
      'players', count(*) filter (where participated), 'achievements', sum(achievement),
      'entries', jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'rank', rank, 'name', display_name, 'score', score, 'mine', user_id = viewer,
        'avatar_member', user_id,
        'avatar_path', avatar_path, 'avatar_icon', avatar_icon
      )) order by rank, display_name, user_id)
    ) as payload
    from ranked
    group by game
  )
  select coalesce(jsonb_object_agg(game, payload), '{}'::jsonb) into scores from by_game;

  select coalesce(greatest(0, total_points)::bigint + 25 * greatest(0, team_wins)::bigint, 0)
    into quest_xp from public.community_word_scores where user_id = viewer;
  quest_xp := coalesce(quest_xp, 0);
  return jsonb_build_object(
    'games', scores, 'quest_xp', quest_xp, 'quest_level', floor(sqrt(quest_xp::double precision/100))::int + 1,
    'plate_access', exists (select 1 from public.community_plate_players where user_id = viewer),
    'mahjong_level', coalesce((select level from public.community_mahjong_campaign where user_id = viewer), 1),
    'wordle_today', (select coalesce(sum(points), 0) from public.community_wordle_guesses
      where game_date = eastern_date and user_id = viewer)
      + case when exists (select 1 from public.community_wordle_days
        where game_date = eastern_date and solved_at is not null)
        and exists (select 1 from public.community_wordle_guesses
          where game_date = eastern_date and user_id = viewer) then 35 else 0 end,
    'wordle_attempts', (select count(*) from public.community_wordle_guesses where game_date = eastern_date),
    'wordle_solved', exists (select 1 from public.community_wordle_days
      where game_date = eastern_date and solved_at is not null),
    'as_of', statement_timestamp()
  );
end;
$$;
revoke all on function public.community_family_scoreboard() from public, anon, authenticated;
grant execute on function public.community_family_scoreboard() to authenticated;

alter table public.community_family_fridge_items add column notes text not null default ''
  check (char_length(notes) <= 280);

create or replace function public.community_family_fridge_state() returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.community_members where user_id = auth.uid() and status = 'approved'
  ) then raise exception 'Approved family membership required' using errcode = '42501'; end if;
  return jsonb_build_object('items', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', item_id, 'category', category, 'name', item_name, 'quantity', quantity, 'notes', notes,
      'done', done, 'updated_at', updated_at, 'added_at', created_at
    ) order by done, created_at, item_id), '[]'::jsonb)
    from public.community_family_fridge_items
  ), 'scope', 'approved_members_only');
end;
$$;

create function public.community_family_fridge_update(
  p_action text, p_id bigint default null, p_category text default null, p_name text default null,
  p_quantity text default '', p_notes text default '', p_done boolean default null,
  p_updated_at timestamptz default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  category_name text := lower(btrim(p_category));
  item_label text := btrim(regexp_replace(coalesce(p_name,''),'[[:space:]]+',' ','g'));
  quantity_label text := btrim(coalesce(p_quantity,''));
  note_label text := btrim(coalesce(p_notes,''));
  existing public.community_family_fridge_items%rowtype;
begin
  if viewer is null or not exists (
    select 1 from public.community_members where user_id = viewer and status = 'approved'
  ) then raise exception 'Approved family membership required' using errcode = '42501'; end if;

  if p_action is null or p_action not in ('add','edit','check','remove','clear_done') then
    raise exception 'Choose a refrigerator note action.' using errcode = '22023';
  end if;
  if p_action in ('add','edit') and (
    category_name is null or category_name not in ('groceries','household')
    or char_length(item_label) not between 1 and 100
    or char_length(quantity_label) > 40 or char_length(note_label) > 280
  ) then raise exception 'Check the category, item name, quantity and notes.' using errcode = '22023'; end if;

  if p_action = 'add' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('community_family_fridge_add', 0));
    select * into existing from public.community_family_fridge_items
      where category = category_name and lower(item_name) = lower(item_label) for update;
    if found then
      if not existing.done then raise exception 'That item is already on the list.' using errcode = '23505'; end if;
      update public.community_family_fridge_items set
        item_name = item_label, quantity = quantity_label, notes = note_label,
        done = false, completed_by = null, completed_at = null, updated_at = clock_timestamp()
      where item_id = existing.item_id;
    else
      if (select count(*) from public.community_family_fridge_items) >= 250 then
        raise exception 'The fridge list is full. Clear completed items first.' using errcode = '22023';
      end if;
      insert into public.community_family_fridge_items(category, item_name, quantity, notes, created_by)
      values (category_name, item_label, quantity_label, note_label, viewer);
    end if;
  elsif p_action = 'clear_done' then
    if p_updated_at is null then raise exception 'Refresh the list before clearing items.' using errcode = '22023'; end if;
    delete from public.community_family_fridge_items where done and updated_at <= p_updated_at;
  else
    select * into existing from public.community_family_fridge_items where item_id = p_id for update;
    if not found or existing.updated_at is distinct from p_updated_at then
      raise exception 'The list changed. Refresh and try again.' using errcode = '40001';
    end if;
    if p_action = 'edit' then
      update public.community_family_fridge_items set
        category = category_name, item_name = item_label, quantity = quantity_label, notes = note_label,
        updated_at = clock_timestamp()
      where item_id = p_id;
    elsif p_action = 'check' then
      if p_done is null then raise exception 'Choose needed or picked up.' using errcode = '22023'; end if;
      update public.community_family_fridge_items set done = p_done,
        completed_by = case when p_done then viewer end, completed_at = case when p_done then clock_timestamp() end,
        updated_at = clock_timestamp()
      where item_id = p_id;
    else
      delete from public.community_family_fridge_items where item_id = p_id;
    end if;
  end if;
  return public.community_family_fridge_state();
exception when unique_violation then
  raise exception 'That item is already on the list.' using errcode = '23505';
end;
$$;
revoke all on function public.community_family_fridge_update(text,bigint,text,text,text,text,boolean,timestamptz) from public, anon, authenticated;
grant execute on function public.community_family_fridge_update(text,bigint,text,text,text,text,boolean,timestamptz) to authenticated;

alter table public.community_family_calendar_events
  add column created_by uuid references auth.users(id) on delete set null,
  add column category text not null default 'plans'
    check (category in ('plans','appointment','work','celebration','other'));

CREATE OR REPLACE FUNCTION public.community_family_calendar_sync_snapshot(p_events jsonb, p_window_start timestamp with time zone, p_window_end timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_count integer;
begin
 if p_events is null or jsonb_typeof(p_events)<>'array' or
    jsonb_array_length(p_events)>5000 or
    p_window_start is null or p_window_end is null or
    p_window_end<=p_window_start or
    p_window_end-p_window_start>interval '15 years' then
    raise exception 'Invalid family calendar sync snapshot' using errcode='22023';
 end if;
 insert into public.community_family_calendar_events
    (event_id,summary,description,location,starts_at,ends_at,all_day,status,updated_at)
 select src.id,coalesce(src.title,'Untitled event'),
    coalesce(src.description,''),coalesce(src.location,''),
    src.starts_at,src.ends_at,coalesce(src.all_day,false),
    coalesce(src.status,'confirmed'),now()
 from jsonb_to_recordset(p_events) as src (
   id text,title text,description text,location text,
   starts_at timestamptz,ends_at timestamptz,all_day boolean,status text
 )
 where src.id not like 'board:%'
 on conflict(event_id) do update set
    summary=excluded.summary,description=excluded.description,
    location=excluded.location,starts_at=excluded.starts_at,
    ends_at=excluded.ends_at,all_day=excluded.all_day,
    status=excluded.status,updated_at=now()
 where community_family_calendar_events.event_id not like 'board:%';
 delete from public.community_family_calendar_events e
 where e.event_id not like 'board:%' and e.starts_at>=p_window_start and e.starts_at<p_window_end
   and not exists(select 1 from jsonb_array_elements(p_events) j where j->>'id'=e.event_id);
 insert into public.community_family_calendar_sync(source,synced_at,status)
 values('family_google_primary',now(),'ok')
 on conflict(source) do update set synced_at=excluded.synced_at,status='ok';
 select count(*) into v_count from public.community_family_calendar_events where event_id not like 'board:%';
 return jsonb_build_object('events',v_count,'synced_at',now(),'source','family_google_primary');
end $function$
;


create or replace function public.community_family_calendar_feed(p_from timestamptz, p_until timestamptz)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  owner_access boolean;
begin
  select role = 'owner' into owner_access from public.community_members
    where user_id = viewer and status = 'approved';
  if not found then raise exception 'Approved family membership required' using errcode = '42501'; end if;
  if p_from is null or p_until is null or p_until <= p_from or p_until - p_from > interval '2 years' then
    raise exception 'Select a valid calendar date range' using errcode = '22023';
  end if;
  return jsonb_build_object('events', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', e.event_id, 'title', e.summary, 'description', e.description, 'location', e.location,
      'start', e.starts_at, 'end', e.ends_at, 'all_day', e.all_day, 'status', e.status,
      'source', case when e.event_id like 'board:%' then 'board' else 'google' end,
      'category', e.category, 'updated_at', e.updated_at,
      'editable', e.event_id like 'board:%' and (owner_access or e.created_by is not distinct from viewer)
    ) order by e.starts_at, e.summary, e.event_id), '[]'::jsonb)
    from (
      select * from public.community_family_calendar_events
      where starts_at < p_until and ends_at >= p_from and status <> 'cancelled'
      order by starts_at, summary, event_id limit 400
    ) e
  ), 'last_synced', (select synced_at from public.community_family_calendar_sync where source = 'family_google_primary'),
  'timezone', 'America/New_York', 'scope', 'approved_members_only');
end;
$$;

create function public.community_family_calendar_change(
  p_action text, p_id text, p_updated_at timestamptz default null, p_event jsonb default null
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  owner_access boolean;
  existing public.community_family_calendar_events%rowtype;
  event_title text := btrim(coalesce(p_event->>'title',''));
  event_location text := btrim(coalesce(p_event->>'location',''));
  event_notes text := btrim(coalesce(p_event->>'description',''));
  event_category text := p_event->>'category';
  all_day_event boolean;
  local_start timestamp;
  local_end timestamp;
  event_start timestamptz;
  event_end timestamptz;
begin
  select role = 'owner' into owner_access from public.community_members
    where user_id = viewer and status = 'approved';
  if not found then raise exception 'Approved family membership required' using errcode = '42501'; end if;
  if p_id is null or p_id !~ '^board:[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$'
     or p_action is null or p_action not in ('add','edit','remove') then
    raise exception 'Manage Google events in your Google Family calendar.' using errcode = '22023';
  end if;
  if p_action <> 'add' then
    select * into existing from public.community_family_calendar_events where event_id = p_id for update;
    if not found then raise exception 'This event was already removed.' using errcode = '22023'; end if;
    if not owner_access and existing.created_by is distinct from viewer then
      raise exception 'Only the organizer or board owner can change this event.' using errcode = '42501';
    end if;
    if existing.updated_at is distinct from p_updated_at then
      raise exception 'The event changed. Refresh and try again.' using errcode = '40001';
    end if;
  end if;
  if p_action = 'remove' then
    delete from public.community_family_calendar_events where event_id = p_id;
    return jsonb_build_object('id', p_id);
  end if;

  if char_length(event_title) not between 1 and 120 or char_length(event_location) > 200
    or char_length(event_notes) > 1500 or event_category is null
    or event_category not in ('plans','appointment','work','celebration','other')
    or p_event->>'start' is null or p_event->>'end' is null
    or (p_event->>'start') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2})?$'
    or (p_event->>'end') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2})?$'
  then raise exception 'Enter a title, category, and valid Eastern dates and times.' using errcode = '22023'; end if;

  all_day_event := coalesce((p_event->>'all_day')::boolean, false);
  if all_day_event then
    local_start := left(p_event->>'start',10)::date;
    local_end := left(p_event->>'end',10)::date + 1;
  else
    if length(p_event->>'start') <> 16 or length(p_event->>'end') <> 16 then
      raise exception 'Enter a start and end time.' using errcode = '22023';
    end if;
    local_start := (p_event->>'start')::timestamp;
    local_end := (p_event->>'end')::timestamp;
  end if;
  event_start := local_start at time zone 'America/New_York';
  event_end := local_end at time zone 'America/New_York';
  if event_start >= event_end or event_end - event_start > interval '1 year'
    or (event_start at time zone 'America/New_York') <> local_start
    or (event_end at time zone 'America/New_York') <> local_end
  then raise exception 'Choose a valid end after the start and avoid skipped daylight-saving times.' using errcode = '22023'; end if;

  if p_action = 'add' then
    insert into public.community_family_calendar_events(
      event_id, summary, description, location, starts_at, ends_at, all_day, status, updated_at, created_by, category
    ) values (p_id,event_title,event_notes,event_location,event_start,event_end,all_day_event,'confirmed',clock_timestamp(),viewer,event_category)
    on conflict (event_id) do nothing;
    if not found then
      if not exists (select 1 from public.community_family_calendar_events
        where event_id = p_id and created_by = viewer and summary = event_title and starts_at = event_start
          and ends_at = event_end and category = event_category and description = event_notes
          and location = event_location and all_day = all_day_event) then
        raise exception 'This event already exists. Refresh the calendar.' using errcode = '23505';
      end if;
    end if;
  else
    update public.community_family_calendar_events set summary = event_title, description = event_notes,
      location = event_location, starts_at = event_start, ends_at = event_end, all_day = all_day_event,
      category = event_category, updated_at = clock_timestamp()
    where event_id = p_id;
  end if;
  return jsonb_build_object('id', p_id);
end;
$$;
revoke all on function public.community_family_calendar_change(text,text,timestamptz,jsonb) from public, anon, authenticated;
grant execute on function public.community_family_calendar_change(text,text,timestamptz,jsonb) to authenticated;

-- The existing plate game remains private to the two approved players.
-- Page each review/filter on the server so older challenges stay reachable.
create function public.community_plate_browse(
  p_scope text, p_offset integer default 0, p_limit integer default 25, p_anchor bigint default null
) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  viewer uuid := auth.uid();
  v_seat text;
  v_players jsonb;
  v_entries jsonb;
  v_total integer;
  page_size integer := least(25, greatest(1, coalesce(p_limit, 25)));
  page_offset integer := greatest(0, coalesce(p_offset, 0));
  anchor_position integer;
begin
  select p.seat into v_seat from public.community_plate_players p
  join public.community_members m on m.user_id = p.user_id and m.status = 'approved'
  where p.user_id = viewer;
  if not found then raise exception 'Approved plate-player membership required' using errcode = '42501'; end if;
  if p_scope is null or p_scope not in ('all','gallery','mine','pending','reviews','past') then
    raise exception 'Choose a plate view.' using errcode = '22023';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'seat', p.seat, 'name', m.display_name, 'starting', p.starting_points,
    'earned', result.earned, 'total', p.starting_points + result.earned
  ) order by p.seat), '[]'::jsonb)
  into v_players
  from public.community_plate_players p join public.community_members m on m.user_id = p.user_id
  cross join lateral (select count(*) as earned from public.community_plate_entries e
    where e.author_id = p.user_id and e.status = 'approved') result;

  select count(*), count(*) filter (where e.id > p_anchor)
  into v_total, anchor_position
  from public.community_plate_entries e
  where case p_scope
    when 'mine' then e.author_id = viewer
    when 'pending' then e.author_id <> viewer and e.status = 'pending'
    when 'reviews' then exists (select 1 from public.community_plate_votes where entry_id = e.id and voter_id = viewer)
    when 'past' then e.status = 'approved'
    else true end;
  if p_anchor is not null then page_offset := (anchor_position / page_size) * page_size; end if;
  if v_total <= page_offset then page_offset := greatest(0, ((v_total - 1) / page_size) * page_size); end if;

  with filtered as (
    select e.* from public.community_plate_entries e
    where case p_scope
      when 'mine' then e.author_id = viewer
      when 'pending' then e.author_id <> viewer and e.status = 'pending'
      when 'reviews' then exists (select 1 from public.community_plate_votes where entry_id = e.id and voter_id = viewer)
      when 'past' then e.status = 'approved'
      else true end
  )
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',e.id,'author_id',e.author_id,'author',m.display_name,'seat',p.seat,
  'plate',e.plate_text,'region',e.region,'photo_path',e.photo_path,
  'guess',e.guess,'status',e.status,'last_reason',e.last_reason,
  'revisions',e.revision_count,'created_at',e.created_at,'updated_at',e.updated_at,
  'history',(
    select coalesce(jsonb_agg(jsonb_build_object(
      'decision',case when v.approved then 'up' else 'down' end,
      'reason',v.reason,'at',v.created_at) order by v.id),'[]'::jsonb)
    from public.community_plate_votes v where v.entry_id=e.id
  ),
  'discussion',(
    select coalesce(jsonb_agg(jsonb_build_object(
      'old',r.old_guess,'guess',r.new_guess,'response',r.response,'at',r.created_at) order by r.id),'[]'::jsonb)
    from public.community_plate_revisions r where r.entry_id=e.id
  )
 ) order by e.id desc),'[]'::jsonb)
 into v_entries
 from (
    select * from filtered order by id desc offset page_offset limit page_size
 ) e join public.community_plate_players p on p.user_id=e.author_id
 join public.community_members m on m.user_id=e.author_id;

  return jsonb_build_object('seat', v_seat, 'players', v_players, 'entries', v_entries,
    'total', v_total, 'offset', page_offset);
end;
$$;
revoke all on function public.community_plate_browse(text,integer,integer,bigint) from public, anon, authenticated;
grant execute on function public.community_plate_browse(text,integer,integer,bigint) to authenticated;

commit;
