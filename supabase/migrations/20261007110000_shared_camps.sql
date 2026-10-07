-- Camping&Joy: 캠핑(정보·멤버·배분·준비 체크)도 모두가 함께 보는 목록으로 저장한다.
-- 로그인이 없으므로 사이트에 들어온 누구나 보고, 만들고, 고치고, 지울 수 있다.
-- 멤버·배분은 앱의 캠핑 구조 그대로 data(jsonb)에 넣는다. 멤버 id는 people.id와 같다.
create table public.camps (
  id uuid primary key,
  name text not null check (char_length(name) <= 50),
  date date not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.camps enable row level security;
create policy "camps: 누구나" on public.camps for all to anon, authenticated using (true) with check (true);
grant select, insert, update, delete on public.camps to anon, authenticated;

-- 다른 사람이 고친 내용이 바로 보이도록 실시간 알림을 켠다.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.camps;
  end if;
end $$;
