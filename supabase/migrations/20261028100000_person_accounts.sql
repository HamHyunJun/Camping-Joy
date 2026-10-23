-- 멤버 카드 하나를 여러 계정이 함께 쓴다(예: 커플이 장비를 같이 쓰는 "김길도/나현정" 카드).
-- people.user_id는 카드를 만든 본인(대표) 계정이고, 같은 카드를 함께 쓰는 다른 계정은 이 표에 둔다.
-- 앱은 이 표를 읽기만 한다. 연결은 관리자가 DB에서 한다.

-- (id, group_id)를 외래키로 가리키려면 유일해야 한다.
alter table public.people add constraint people_id_group_key unique (id, group_id);

create table public.person_accounts (
  person_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (person_id, user_id),
  -- 카드와 같은 모임의 계정만 연결한다.
  foreign key (person_id, group_id) references public.people (id, group_id) on delete cascade,
  -- 한 계정은 모임마다 카드 하나에만 연결한다.
  unique (group_id, user_id)
);

-- 한 계정이 같은 모임에서 대표 계정과 함께 쓰는 계정을 겸할 수 없다.
create or replace function public.check_person_account_free() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from public.people where group_id = new.group_id and user_id = new.user_id) then
    raise exception 'account already has a card in this group';
  end if;
  return new;
end $$;
create trigger person_accounts_free before insert or update on public.person_accounts
  for each row execute function public.check_person_account_free();

create or replace function public.check_person_owner_free() returns trigger
language plpgsql as $$
begin
  if new.user_id is not null and exists (select 1 from public.person_accounts where group_id = new.group_id and user_id = new.user_id) then
    raise exception 'account already shares a card in this group';
  end if;
  return new;
end $$;
create trigger people_owner_free before insert or update of user_id on public.people
  for each row execute function public.check_person_owner_free();

alter table public.person_accounts enable row level security;
create policy "person_accounts: 모임 구성원 읽기" on public.person_accounts for select to authenticated using (public.is_group_member(group_id));
revoke all on public.person_accounts from anon, authenticated;
grant select on public.person_accounts to authenticated;

-- 카드를 고칠 수 있는 사람: 관리자·운영진, 대표 계정, 함께 쓰는 계정.
create policy "people: 함께 쓰는 계정 수정" on public.people for update to authenticated
  using (public.is_group_member(group_id) and exists (select 1 from public.person_accounts a where a.person_id = people.id and a.user_id = auth.uid()))
  with check (public.is_group_member(group_id) and exists (select 1 from public.person_accounts a where a.person_id = people.id and a.user_id = auth.uid()));

create policy "equipments: 함께 쓰는 계정 쓰기" on public.equipments for all to authenticated
  using (exists (select 1 from public.person_accounts a join public.people p on p.id = a.person_id
    where p.id = equipments.person_id and a.user_id = auth.uid() and public.is_group_member(p.group_id)))
  with check (exists (select 1 from public.person_accounts a join public.people p on p.id = a.person_id
    where p.id = equipments.person_id and a.user_id = auth.uid() and public.is_group_member(p.group_id)));

-- 구성원을 내보내면 함께 쓰던 카드와의 연결도 끊는다(카드·장비는 남긴다).
create or replace function public.remove_group_member(g uuid, u uuid) returns void
language plpgsql security definer set search_path = public as $$
declare my_role text := public.group_role(g);
declare target_role text;
begin
  if my_role not in ('owner', 'admin') then raise exception 'not allowed'; end if;
  if u = auth.uid() then raise exception 'cannot remove yourself'; end if;
  select role into target_role from public.group_members where group_id = g and user_id = u;
  if target_role is null or target_role = 'owner' then raise exception 'cannot remove this member'; end if;
  if my_role = 'admin' and target_role <> 'member' then raise exception 'not allowed'; end if;
  delete from public.group_members where group_id = g and user_id = u;
  update public.people set user_id = null where group_id = g and user_id = u;
  delete from public.person_accounts where group_id = g and user_id = u;
end $$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'person_accounts') then
    alter publication supabase_realtime add table public.person_accounts;
  end if;
end $$;
