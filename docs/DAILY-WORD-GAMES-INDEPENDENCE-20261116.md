# Daily Word Quest vs w0rdle: independent answers

**Incident:** November 16, 2026. The user reported identical answers in both daily word games, and specifically requested that this never happen again.

## Root cause verified in production

The two independent game-day tables were populated with the **same `word_id`** by both `community_wordle_state()` and `community_wordle_submit()`. The w0rdle UI explicitly stated that it shared the Quest answer. All five existing days (Nov 12–16) had the same answer, by design rather than by chance.

The existing `community_wordle_pick()` was not used by those RPCs, and its previous fallback could still select the Quest word if the daily Quest row was not present.

## Applied repair and proof

Production Supabase migration **20261116183421** (`separate_word_quest_and_wordle_daily_answers`) successfully applied on November 16.

- Both w0rdle entry paths call `community_wordle_pick(p_day)`, not the Quest word. An existing day row is never rewritten on conflict.
- Every fallback of the selector excludes the **actual Quest answer**, from the existing Quest day or from the deterministic Quest picker. This works regardless of which game opens first and regardless of difficulty tier.
- An `AFTER INSERT OR UPDATE OF word_id` trigger on **each** game-day table checks cross-game word equality and blocks duplicate future assignments with SQLSTATE 23514. It uses an advisory transaction lock to serialize concurrent game-day creation and has no public callable RPC rights.
- All historic rows, ongoing guesses, feedback, scores, awards and team results are preserved. Today's puzzle remains intact because both games already had guesses.
- A read-only SQL validation over **365 dates from 2026-11-17 through 2027-11-16** returned `collision_days=0`, `missing_days=0`, `all_distinct=true`, and `safeguards_installed=2`.
- The first newly generated pair on **2026-11-17 America/New_York** therefore has different answers. Each game still supports shared teammate clues and daily scoring independently.

## Regression gates

`tests/daily-word-independence.test.mjs` validates all three selector fallbacks, both RPC entry paths, the two DB safeguards and correct member-facing rules. This is source-level evidence, alongside the production readback query. Avoid replaying existing SQL that forced both games to share one day word.

**Remaining acceptance:** after the next Eastern midnight, verify both games' *new* date records using a read-only equality test, and verify gameplay with approved member sessions. Do not reveal unsolved answers or reset any player's progress.

## Safety and budget

No bank words, existing game day rows, account records or player histories were updated. No paid add-ons. The SQL was applied only to the active `cowboys-web-toolbox-community` project; the inactive `cowboys-crew-portal` project was untouched.

## Return to interrupted Family Universe work

Robot-head silhouette upgrade PR #53 (Radio Courier tuning wings, Wind-up Surveyor scope fins and Boardwalk Automaton gauge) is separate; resume its deployment checks without conflating the two changes.
