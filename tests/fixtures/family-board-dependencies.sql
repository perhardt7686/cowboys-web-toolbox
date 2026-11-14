-- Embedded Postgres stand-ins for Supabase managed services and game tables.
-- Production definitions predate this migration. These fixtures model only
-- the columns and constraints the Family Message Board reads or writes.
create schema realtime;
create table realtime.messages (
  topic text, event text, payload jsonb, private boolean, extension text
);
alter table realtime.messages enable row level security;
grant usage on schema realtime to authenticated, anon;
grant select on realtime.messages to authenticated, anon;
create function realtime.topic() returns text language sql stable as $$
  select current_setting('realtime.topic', true)
$$;
create function realtime.send(payload jsonb, event text, topic text, private boolean)
returns void language sql as $$
  insert into realtime.messages(topic,event,payload,private,extension)
  values (topic,event,payload,private,'broadcast');
$$;

create table public.community_family_calendar_events (event_id text primary key, summary text default ''::text, description text default ''::text, location text default ''::text, starts_at timestamp with time zone, ends_at timestamp with time zone, all_day boolean default false, status text default 'confirmed'::text, updated_at timestamp with time zone default now());
create table public.community_family_calendar_sync (source text primary key, synced_at timestamp with time zone, status text default 'ready'::text);
create table public.community_family_fridge_items (item_id bigint generated always as identity primary key, category text, item_name text, quantity text default ''::text, done boolean default false, created_by uuid, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now(), completed_by uuid, completed_at timestamp with time zone);
create table public.community_mahjong_badges (user_id uuid, code text, unlocked_at timestamp with time zone);
create table public.community_mahjong_campaign (user_id uuid primary key, level integer default 1, levels_cleared integer default 0, qualified_streak integer default 0, longest_streak integer default 0, campaign_bonus bigint default 0, crown_earned boolean default false, updated_at timestamp with time zone default now());
create table public.community_mahjong_campaign_attempts (run_id uuid, user_id uuid, level integer, qualified boolean, time_seconds integer, bonus integer, reason text, created_at timestamp with time zone);
create table public.community_mahjong_runs (id uuid, user_id uuid, tiles jsonb, status text, score integer, pairs integer, combo integer, hints integer, shuffles integer, undos integer, moves jsonb, started_at timestamp with time zone, updated_at timestamp with time zone, finished_at timestamp with time zone, level integer, paused_at timestamp with time zone, paused_seconds integer);
create table public.community_mahjong_stats (user_id uuid primary key, wins integer default 0, total_pairs integer default 0, all_time_points bigint default 0, best_score integer default 0, perfect_wins integer default 0, fastest_seconds integer, updated_at timestamp with time zone default now());
create table public.community_plate_entries (id bigint generated always as identity primary key, author_id uuid, plate_text text, region text default ''::text, photo_path text, guess text, status text default 'pending'::text, last_reason text default ''::text, approved_by uuid, approved_at timestamp with time zone, revision_count integer default 0, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now());
create table public.community_plate_players (user_id uuid primary key, seat text, starting_points integer);
create table public.community_plate_revisions (id bigint generated always as identity primary key, entry_id bigint, author_id uuid, old_guess text, new_guess text, response text default ''::text, created_at timestamp with time zone default now());
create table public.community_plate_votes (id bigint generated always as identity primary key, entry_id bigint, voter_id uuid, approved boolean, reason text default ''::text, created_at timestamp with time zone default now());
create table public.community_word_archived_rounds (id bigint, game_date date, original_word_id integer, team_score integer, solved_at timestamp with time zone, solved_by uuid, guesses jsonb, reason text, archived_at timestamp with time zone);
create table public.community_word_bank (id integer, answer text, clue text, difficulty text);
create table public.community_word_days (game_date date primary key, word_id integer, started_at timestamp with time zone, solved_at timestamp with time zone, solved_by uuid, team_score integer);
create table public.community_word_guesses (id bigint, game_date date, user_id uuid, guess text, feedback text[], points integer, created_at timestamp with time zone);
create table public.community_word_scores (user_id uuid primary key, total_points integer default 0, solved_words integer default 0, team_wins integer default 0, active_streak integer default 0, best_streak integer default 0, best_daily_score integer default 0, last_win_day date);
create table public.community_wordle_days (game_date date primary key, word_id integer, started_at timestamp with time zone, solved_at timestamp with time zone, solved_by uuid);
create table public.community_wordle_guesses (game_date date, user_id uuid, attempt smallint, guess text, feedback text[], created_at timestamp with time zone default now(), points integer default 0);
create table public.community_wordle_scores (user_id uuid primary key, games_played integer default 0, wins integer default 0, total_points integer default 0, current_streak integer default 0, best_streak integer default 0, last_played date, last_win date, solves integer default 0);
create unique index family_fridge_fixture_name on public.community_family_fridge_items(category, lower(item_name));
