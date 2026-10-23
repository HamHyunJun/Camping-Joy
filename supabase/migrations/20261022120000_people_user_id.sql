-- 로그인한 계정 하나당 본인 한 명만 등록한다. 계정 없이 만든 예전 멤버는 user_id가 비어 있다.
alter table public.people
  add column if not exists user_id uuid unique references auth.users (id) on delete set null;
