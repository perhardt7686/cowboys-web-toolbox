CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated,service_role;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('test.user_id',true),'')::uuid;
$$;
CREATE FUNCTION public.cowboys_core_data_owner() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN auth.uid() IN ('11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid)
    THEN '11111111-1111-4111-8111-111111111111'::uuid END;
$$;
