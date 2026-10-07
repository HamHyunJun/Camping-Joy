-- Camping&Joy: 멤버·장비 등록을 모두가 함께 쓰는 목록으로 저장한다.
-- 로그인이 없으므로 사이트에 들어온 누구나 보고, 추가하고, 고치고, 지울 수 있다.

-- 이전 설계(캠핑 링크 공유)에서 만든 테이블·함수는 더 쓰지 않으므로 지운다.
drop table if exists public.camp_items, public.camp_gear, public.camp_members, public.camp_access, public.camps cascade;
drop function if exists public.join_camp(text), public.claim_member(uuid, uuid), public.set_item_ready(uuid, boolean),
  public.rotate_share_token(uuid), public.is_camp_owner(uuid), public.can_view_camp(uuid), public.my_member_id(uuid),
  public.touch_updated_at(), public.clamp_items_to_gear() cascade;

-- 사람 (멤버·장비 등록의 이름). id는 앱이 만든다.
create table public.people (
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 20),
  created_at timestamptz not null default now()
);

-- 사람이 가진 장비
create table public.equipments (
  id uuid primary key,
  person_id uuid not null references public.people (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  category text not null check (category in ('shelter', 'furniture', 'kitchen', 'sleeping', 'lighting', 'etc')),
  size text check (size is null or char_length(size) <= 20),
  quantity int not null check (quantity between 1 and 99),
  created_at timestamptz not null default now()
);
create index on public.equipments (person_id);

alter table public.people enable row level security;
alter table public.equipments enable row level security;

create policy "people: 누구나" on public.people for all to anon, authenticated using (true) with check (true);
create policy "equipments: 누구나" on public.equipments for all to anon, authenticated using (true) with check (true);
grant select, insert, update, delete on public.people, public.equipments to anon, authenticated;

-- 다른 사람이 고친 내용이 바로 보이도록 실시간 알림을 켠다.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.people, public.equipments;
  end if;
end $$;
