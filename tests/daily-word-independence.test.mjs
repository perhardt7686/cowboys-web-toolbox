import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const sql=read('supabase/migrations/20261116183421_separate_word_quest_and_wordle_daily_answers.sql');
const ui=read('docs/commons-letter-lock.mjs');

test('each word game selects a different daily bank answer, even in fallback paths',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.community_wordle_pick\(p_day date\)/);
  const exclusions=sql.match(/upper\(b\.answer\)<>q\.answer/g)||[];
  assert.equal(exclusions.length,3,'all 3 picker fallbacks must exclude the Quest answer');
  assert.match(sql,/public\.community_word_pick\(p_day\)/,'exclude deterministic Quest pick, regardless of game-opening order');
  assert.match(sql,/public\.community_word_days d WHERE d\.game_date=p_day/,'use stored Quest answer when available');
});

test('both w0rdle entry paths select their own answer and preserve started rounds',()=>{
  const picks=sql.match(/values\(v_day,public\.community_wordle_pick\(v_day\)\)/g)||[];
  assert.equal(picks.length,2,'wordle state and submit must each use independent selector');
  const safeWordleWrites=sql.match(/insert into public\.community_wordle_days\(game_date,word_id\)\s+values\(v_day,public\.community_wordle_pick\(v_day\)\)\s+on conflict\(game_date\) do nothing;/g)||[];
  assert.equal(safeWordleWrites.length,2,
    'both wordle entry paths must never rewrite an existing puzzle under recorded guesses');
  assert.doesNotMatch(sql,/select game_date,word_id from public\.community_word_days where game_date=v_day/i);
});

test('a database trigger checks answer equality in either game insertion order',()=>{
  assert.match(sql,/AFTER INSERT OR UPDATE OF word_id ON public\.community_word_days/i);
  assert.match(sql,/AFTER INSERT OR UPDATE OF word_id ON public\.community_wordle_days/i);
  assert.match(sql,/v_other_answer=v_new_answer/,'compare the actual word, not just the numeric id');
  assert.match(sql,/pg_advisory_xact_lock/,'serialize concurrent day setup');
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.community_distinct_daily_answers_guard\(\) FROM PUBLIC, anon, authenticated/);
});

test('the member-facing rules explain independent game words without losing shared team clues',()=>{
  assert.match(ui,/w0rdle and Daily Word Quest have different answers each day/);
  assert.match(ui,/Teammates share guesses and clues within each game/);
  assert.doesNotMatch(ui,/same five-letter answer in Daily Word Quest and w0rdle/i);
  assert.doesNotMatch(ui,/SAME answer as Daily Word Quest/);
  assert.match(read('docs/community.html'),/commons-letter-lock\.mjs\?v=wordcompact7/,
    'fresh client module version prevents stale same-answer instructions');
});
