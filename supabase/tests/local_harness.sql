-- Supabase 없이 일반 Postgres 16에서 권한 규칙을 시험하는 스크립트.
-- 1) 빈 DB에 아래 '흉내' 부분 실행 2) migrations/*.sql 실행 3) 시나리오 부분 실행.
-- 실패해야 하는 동작은 ERROR 또는 0건으로 나와야 정상이에요.

-- ===== Supabase 흉내 (auth.uid, 역할) =====
create role anon nologin; create role authenticated nologin;
create schema auth; create schema extensions;
grant usage on schema auth, extensions, public to anon, authenticated;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
insert into auth.users values ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),('00000000-0000-0000-0000-00000000000c'),('00000000-0000-0000-0000-00000000000d');
