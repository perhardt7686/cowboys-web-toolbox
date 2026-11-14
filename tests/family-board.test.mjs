import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {installUpgradeSchema} from './helpers/community-db.mjs';
import {clockTime, easternMidnight, eventOnDate, shiftMonth} from '../docs/family-board-core.mjs';

test('Eastern calendar preserves midnight and all-day boundaries across DST', () => {
  assert.equal(easternMidnight('2026-03-08').toISOString(), '2026-03-08T05:00:00.000Z');
  assert.equal(easternMidnight('2026-03-09').toISOString(), '2026-03-09T04:00:00.000Z');
  assert.equal(easternMidnight('2026-11-01').toISOString(), '2026-11-01T04:00:00.000Z');
  assert.equal(easternMidnight('2026-11-02').toISOString(), '2026-11-02T05:00:00.000Z');
  assert.equal(clockTime('2026-11-02T05:00:00Z'), '00:00');
  assert.equal(shiftMonth('2026-01-31', 1), '2026-02-28');
  const event = {start: easternMidnight('2026-11-01'), end: easternMidnight('2026-11-02')};
  assert.equal(eventOnDate(event, '2026-11-01'), true);
  assert.equal(eventOnDate(event, '2026-11-02'), false);
});

test('family tools enforce role isolation, persisted changes, and minimal live updates', async t => {
  const pg = new PGlite();
  const ids = {
    owner: '00000000-0000-4000-8000-000000000001',
    member: '00000000-0000-4000-8000-000000000002',
    other: '00000000-0000-4000-8000-000000000003',
    pending: '00000000-0000-4000-8000-000000000004',
    suspended: '00000000-0000-4000-8000-000000000005',
    outsider: '00000000-0000-4000-8000-000000000006'
  };
  const query = (sql, parameters) => pg.query(sql, parameters);
  const call = async (name, ...params) => (await query(
    'select public.' + name + '(' + params.map((_, i) => '$' + (i + 1)).join(',') + ') as result', params
  )).rows[0].result;
  const as = async name => {
    await pg.exec('reset role');
    await query("select set_config('request.jwt.claim.sub', $1, false)", [ids[name] || '']);
    if (name !== 'system') await pg.exec('set role ' + (name === 'anon' ? 'anon' : 'authenticated'));
  };
  const refused = (promise, code = '42501') => assert.rejects(promise, error => error.code === code);
  const fridge = (...args) => call('community_family_fridge_update', ...args);
  const feed = () => call('community_family_calendar_feed', '2026-11-01T04:00:00Z', '2026-12-01T05:00:00Z');
  const calendar = (...args) => call('community_family_calendar_change', ...args);
  const scoreboard = () => call('community_family_scoreboard');
  const plate = (...args) => call('community_plate_browse', ...args);
  try {
    await pg.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
      $$; grant usage on schema public,auth to anon,authenticated,service_role;
      grant execute on function auth.uid() to anon,authenticated,service_role;`);
    for (const id of Object.values(ids)) await query('insert into auth.users values($1)', [id]);
    const directory = new URL('../supabase/migrations/', import.meta.url);
    const base = (await readdir(directory)).find(name => name.endsWith('_community.sql'));
    await pg.exec(await readFile(new URL(base, directory), 'utf8'));
    await installUpgradeSchema(pg);
    for (const [name, id] of Object.entries(ids)) {
      if (name === 'outsider') continue;
      await query(`insert into public.community_members(user_id,display_name,role,status,rules_version) values($1,$2,$3,$4,'2026-10-23')`,
        [id, name === 'owner' ? 'Fixture owner' : 'Fixture ' + name,
          name === 'owner' ? 'owner' : 'member', ['pending', 'suspended'].includes(name) ? name : 'approved']);
    }
    await query(`insert into public.community_mahjong_stats(user_id, wins, total_pairs, best_score)
      values ($1,2,72,800), ($2,1,36,800), ($3,1,36,500), ($4,9,99,900)
    `, [ids.owner, ids.member, ids.other, ids.pending]);
    await query(`insert into public.community_wordle_scores(user_id,total_points,games_played,solves) values($1,37,1,1)`, [ids.member]);
    await query(`insert into public.community_word_scores(user_id,total_points,team_wins) values($1,50,2)`, [ids.member]);
    await query(`insert into public.community_plate_players(user_id,seat,starting_points) values($1,'cowboy',10),($2,'ana',20)`, [ids.owner, ids.member]);
    await query(`insert into public.community_plate_entries(author_id,plate_text,photo_path,guess,status) values
      ($1,'APPROVED','path1','First challenge','approved'),($1,'WAITING','path2','Second challenge','pending'),
      ($2,'REVIEWED','path3','Third challenge','needs_revision')`, [ids.owner, ids.member]);
    await query(`insert into public.community_plate_votes(entry_id,voter_id,approved)
      select id,$1,false from public.community_plate_entries where plate_text='REVIEWED'`, [ids.owner]);


    await t.test('signed-out, pending, suspended and nonmember accounts cannot read or write', async () => {
      for (const role of ['anon','pending','suspended','outsider']) {
        await as(role);
        await refused(scoreboard);
        await refused(plate('all'));
        await refused(call('community_family_fridge_state'));
        await refused(fridge('add',null,'groceries','fixture'));
        await refused(feed);
        await refused(query('select * from public.community_family_board_events'));
        await refused(calendar('add','board:00000000-0000-4000-8000-000000000101'));
        if (role === 'anon') await refused(query('select * from public.community_family_revisions'));
        else assert.equal((await query('select * from public.community_family_revisions')).rows.length, 0);
      }
    });

    await t.test('ranks, participation and plate scopes use recorded events and preserve the private match', async () => {
      await as('member');
      const mine = await scoreboard();
      assert.deepEqual(mine.games.mahjong.entries.map(row => row.rank), [1,1,2]);
      assert.equal(mine.games.mahjong.entries.find(row => row.mine).score, 800);
      assert.equal(mine.games.mahjong.players, 3);
      assert.equal(mine.games.wordle.entries[0].score, 37);
      assert.equal(mine.games.wordquest.entries[0].score, 50);
      assert.equal(mine.games.plates.entries[0].score, 20);
      assert.equal((await plate('pending')).entries[0].plate, 'WAITING');
      assert.equal((await plate('mine')).total, 1);
      assert.equal((await plate('past')).total, 1);
      assert.equal((await plate('gallery', 1, 1)).entries[0].plate, 'WAITING');
      assert.equal((await plate('all', 0, 1, '1')).entries[0].plate, 'APPROVED');
      await as('owner');
      assert.equal((await plate('reviews')).entries[0].plate, 'REVIEWED');
      await as('other');
      const family = await scoreboard();
      assert.equal(family.plate_access, false);
      assert.equal(family.games.plates, undefined);
      await refused(plate('all'));
      const receipts = (await query('select topic,revision from public.community_family_revisions order by topic')).rows;
      assert.deepEqual(receipts.map(row => row.topic), ['calendar','fridge','scores']);
      assert.ok(receipts.find(row => row.topic === 'scores').revision > 0);
      await refused(query("update public.community_family_revisions set revision=0 where topic='scores'"));
    });

    await t.test('two approved members can update a fridge item without duplicating it or overwriting newer changes', async () => {
      await as('member');
      const before = (await query("select revision from public.community_family_revisions where topic='fridge'")).rows[0].revision;
      const initial = await fridge('add',null,'groceries','  Fixture   milk ','2','Oat');
      assert.equal(Number((await query("select revision from public.community_family_revisions where topic='fridge'")).rows[0].revision), Number(before) + 1);
      const item = initial.items[0];
      assert.equal(item.name, 'Fixture milk');
      assert.equal(item.notes, 'Oat');
      await as('other');
      await refused(fridge('add',null,'groceries','fixture milk','5','Other'), '23505');
      const checked = (await fridge('check',item.id,null,null,'','',true,item.updated_at)).items[0];
      assert.equal(checked.done, true);
      await as('member');
      await refused(fridge('edit',item.id,'groceries',item.name,'3','Oat',null,item.updated_at), '40001');
      const undone = (await fridge('check',item.id,null,null,'','',false,checked.updated_at)).items[0];
      const edited = (await fridge('edit',item.id,'household',item.name,'1','Moved',null,undone.updated_at)).items[0];
      assert.equal(edited.category, 'household');
      await as('other');
      const removed = await fridge('remove',edited.id,null,null,'','',null,edited.updated_at);
      assert.equal(removed.items.length, 0);
    });

    await t.test('board events persist alongside the Google calendar and obey author and owner permissions', async () => {
      const id = 'board:00000000-0000-4000-8000-000000000101';
      const event = {title:'Fixture event',location:'Fixture location',description:'Fixture details',
        category:'appointment',start:'2026-11-03T13:30',end:'2026-11-03T14:15',all_day:false};
      await as('member');
      assert.equal((await calendar('add',id,null,event)).id, id);
      await calendar('add',id,null,event);
      const before = (await feed()).events;
      assert.equal(before.length, 1);
      assert.equal(new Date(before[0].start).toISOString(), '2026-11-03T18:30:00.000Z');
      await as('system');
      const googleInsert = "insert into public.community_family_calendar_events(event_id,summary,starts_at,ends_at) values('google-fixture','Fixture mirror','2026-11-05T18:00:00Z','2026-11-05T19:00:00Z')";
      await query(googleInsert);
      assert.equal((await query("select count(*)::int n from public.community_family_calendar_events where event_id like 'board:%'")).rows[0].n, 0);
      await as('other');
      const otherView = (await feed()).events;
      assert.equal(otherView.length, 2);
      assert.ok(otherView.every(row => !row.editable));
      await refused(calendar('remove',id,before[0].updated_at));
      await as('owner');
      await refused(calendar('edit','google-fixture',null,event), '22023');
      await calendar('edit',id,before[0].updated_at,{...event,title:'Edited fixture event'});
      const revised = (await feed()).events.find(row => row.id === id);
      assert.equal(revised.title,'Edited fixture event');
      await calendar('remove',id,revised.updated_at);
      assert.equal((await feed()).events[0].source,'google');
    });
  } finally { await pg.close(); }
});
