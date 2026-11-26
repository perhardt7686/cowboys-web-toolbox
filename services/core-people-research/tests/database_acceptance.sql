-- Fixtures represent owner, existing shared editor, and unrelated signed-in member.
SET ROLE authenticated;
SELECT set_config('test.user_id','11111111-1111-4111-8111-111111111111',false);
INSERT INTO public.cowboys_core_people_cases(title,kind,query) VALUES('Fixture case','username','corefixture');
DO $$
DECLARE c uuid; r jsonb; again jsonb;
BEGIN
  SELECT id INTO c FROM public.cowboys_core_people_cases;
  r:=public.cowboys_core_people_begin_run(c,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  again:=public.cowboys_core_people_begin_run(c,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  IF r->>'id' IS DISTINCT FROM again->>'id' THEN RAISE EXCEPTION 'non-idempotent start'; END IF;
  IF public.cowboys_core_people_scan_payload((r->>'id')::uuid)->>'query'<>'corefixture' THEN RAISE EXCEPTION 'payload mismatch'; END IF;
  BEGIN
    PERFORM public.cowboys_core_people_begin_run(c,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    RAISE EXCEPTION 'parallel run allowed';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM<>'scan_already_active' THEN RAISE; END IF;
  END;
  BEGIN
    UPDATE public.cowboys_core_people_runs SET status='finished';
    RAISE EXCEPTION 'client forged status';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.cowboys_core_people_finish_run((r->>'id')::uuid,'finished','FINISHED','test','[]');
    RAISE EXCEPTION 'client called trusted writer';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SELECT set_config('test.user_id','22222222-2222-4222-8222-222222222222',false);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.cowboys_core_people_cases)<>1 THEN RAISE EXCEPTION 'shared editor lost access'; END IF;
  UPDATE public.cowboys_core_people_cases SET notes='Shared editor note';
  BEGIN
    UPDATE public.cowboys_core_people_cases SET created_by='22222222-2222-4222-8222-222222222222';
    RAISE EXCEPTION 'audit author was forgeable';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;

SELECT set_config('test.user_id','33333333-3333-4333-8333-333333333333',false);
DO $$ DECLARE c uuid; BEGIN
  IF EXISTS(SELECT 1 FROM public.cowboys_core_people_cases) OR EXISTS(SELECT 1 FROM public.cowboys_core_people_runs)
    THEN RAISE EXCEPTION 'cross-owner data visible'; END IF;
  BEGIN
    INSERT INTO public.cowboys_core_people_cases(title,kind,query) VALUES('Forbidden','username','forbidden');
    RAISE EXCEPTION 'unrelated member created case';
  EXCEPTION WHEN insufficient_privilege OR not_null_violation THEN NULL; END;
  BEGIN
    PERFORM public.cowboys_core_people_begin_run(gen_random_uuid(),gen_random_uuid());
    RAISE EXCEPTION 'unrelated member started scan';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;

DO $$ DECLARE r uuid; c uuid; i int; BEGIN
  SELECT id,case_id INTO r,c FROM public.cowboys_core_people_runs LIMIT 1;
  BEGIN
    PERFORM public.cowboys_core_people_finish_run(r,'finished','ERROR-FAILED','test','[]');
    RAISE EXCEPTION 'failed engine reported finished';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM<>'engine_not_finished' THEN RAISE; END IF;
  END;
  PERFORM public.cowboys_core_people_finish_run(r,'finished','FINISHED','test',
    '[{"event_type":"ACCOUNT_EXTERNAL_OWNED","source_url":"https://gitlab.com/corefixture","source_name":"GitLab","observed_at":"2026-01-01T00:00:00Z"}]');
  PERFORM public.cowboys_core_people_finish_run(r,'failed','ERROR-FAILED','test','[]');
  IF (SELECT status FROM public.cowboys_core_people_runs WHERE id=r)<>'finished' THEN RAISE EXCEPTION 'terminal result overwritten'; END IF;
  IF (SELECT count(*) FROM public.cowboys_core_people_findings)<>1 THEN RAISE EXCEPTION 'finding not saved'; END IF;
  PERFORM set_config('test.user_id','11111111-1111-4111-8111-111111111111',false);
  FOR i IN 1..2 LOOP
    r:=(public.cowboys_core_people_begin_run(c,gen_random_uuid())->>'id')::uuid;
    PERFORM public.cowboys_core_people_finish_run(r,'cancelled','USER-CANCELLED','test','[]');
  END LOOP;
  BEGIN
    PERFORM public.cowboys_core_people_begin_run(c,gen_random_uuid());
    RAISE EXCEPTION 'hourly limit not enforced';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM<>'scan_limit_reached' THEN RAISE; END IF;
  END;
END $$;

SET ROLE authenticated;
SELECT set_config('test.user_id','22222222-2222-4222-8222-222222222222',false);
UPDATE public.cowboys_core_people_findings SET review_state='different_person',review_note='Fixture review';
DO $$ BEGIN
  IF (SELECT review_state FROM public.cowboys_core_people_findings LIMIT 1)<>'different_person' THEN RAISE EXCEPTION 'shared review failed'; END IF;
  BEGIN
    UPDATE public.cowboys_core_people_findings SET source_url='https://evil.example';
    RAISE EXCEPTION 'client changed source evidence';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
DELETE FROM public.cowboys_core_people_cases;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.cowboys_core_people_runs) OR EXISTS(SELECT 1 FROM public.cowboys_core_people_findings)
    THEN RAISE EXCEPTION 'case deletion did not remove evidence'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.cowboys_core_people_rate_log)<>3 THEN RAISE EXCEPTION 'delete reset rate limit'; END IF;
END $$;
