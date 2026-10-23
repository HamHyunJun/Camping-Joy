-- Camping&Joy: 모임(groups) 단위로 멤버·장비·캠핑을 나눈다.
-- 모임을 만든 사람이 관리자(owner)가 되고, 관리자가 운영진(admin)을 지정한다. 가입은 신청(pending) 후 관리자·운영진이 승인한다.
-- 이제부터 로그인한 사람만, 소속된 모임의 데이터만 볼 수 있다.

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 30),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'pending')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
-- 모임마다 관리자는 한 명이다.
create unique index group_members_one_owner on public.group_members (group_id) where role = 'owner';

-- 내가 이 모임에서 맡은 역할. 정책에서 쓰므로 RLS를 거치지 않게(security definer) 만든다.
create or replace function public.group_role(g uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from public.group_members where group_id = g and user_id = auth.uid()
$$;
create or replace function public.is_group_member(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.group_role(g) in ('owner', 'admin', 'member'), false)
$$;
create or replace function public.is_group_staff(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.group_role(g) in ('owner', 'admin'), false)
$$;
revoke all on function public.group_role(uuid), public.is_group_member(uuid), public.is_group_staff(uuid) from public, anon;
grant execute on function public.group_role(uuid), public.is_group_member(uuid), public.is_group_staff(uuid) to authenticated;

-- 첫 모임: 지금까지 등록된 멤버·장비·캠핑을 모두 담는다. 관리자는 첫 로그인 뒤에 지정한다.
alter table public.people add column group_id uuid references public.groups (id) on delete cascade;
alter table public.camps add column group_id uuid references public.groups (id) on delete cascade;
do $$
declare first_group uuid;
begin
  insert into public.groups (name) values ('Camping&Joy') returning id into first_group;
  update public.people set group_id = first_group;
  update public.camps set group_id = first_group;
end $$;
alter table public.people alter column group_id set not null;
alter table public.camps alter column group_id set not null;
create index on public.people (group_id);
create index on public.camps (group_id);

-- 계정당 본인 한 명은 모임마다 따로 센다.
alter table public.people drop constraint if exists people_user_id_key;
alter table public.people add constraint people_group_user_key unique (group_id, user_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- 모임 목록은 로그인한 누구나 본다(검색용). 만들기·가입은 아래 함수로만 한다.
create policy "groups: 로그인하면 읽기" on public.groups for select to authenticated using (true);
create policy "group_members: 읽기" on public.group_members for select to authenticated
  using (user_id = auth.uid() or (role <> 'pending' and public.is_group_member(group_id)) or public.is_group_staff(group_id));
revoke all on public.groups, public.group_members from anon, authenticated;
grant select on public.groups, public.group_members to authenticated;

-- 모임 만들기: 만든 사람이 관리자가 된다.
create or replace function public.create_group(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  insert into public.groups (name) values (trim(p_name)) returning id into new_id;
  insert into public.group_members (group_id, user_id, role) values (new_id, auth.uid(), 'owner');
  return new_id;
end $$;

-- 가입 신청. 이미 신청했거나 소속이면 그대로 둔다.
create or replace function public.request_join(g uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  insert into public.group_members (group_id, user_id, role) values (g, auth.uid(), 'pending') on conflict do nothing;
end $$;

-- 가입 신청을 승인하거나 거절한다. 관리자·운영진만 할 수 있다.
create or replace function public.decide_join(g uuid, u uuid, approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_staff(g) then raise exception 'not allowed'; end if;
  if approve then
    update public.group_members set role = 'member' where group_id = g and user_id = u and role = 'pending';
  else
    delete from public.group_members where group_id = g and user_id = u and role = 'pending';
  end if;
end $$;

-- 운영진 지정·해제. 관리자만 할 수 있고, 관리자 본인은 바꿀 수 없다.
create or replace function public.set_member_role(g uuid, u uuid, new_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.group_role(g) <> 'owner' then raise exception 'not allowed'; end if;
  if new_role not in ('admin', 'member') then raise exception 'invalid role'; end if;
  update public.group_members set role = new_role where group_id = g and user_id = u and role in ('admin', 'member');
end $$;

revoke all on function public.create_group(text), public.request_join(uuid), public.decide_join(uuid, uuid, boolean), public.set_member_role(uuid, uuid, text) from public, anon;
grant execute on function public.create_group(text), public.request_join(uuid), public.decide_join(uuid, uuid, boolean), public.set_member_role(uuid, uuid, text) to authenticated;

-- 모임 운영자는 신청자·멤버의 닉네임과 이미지를 볼 수 있다.
create policy "profiles: 모임 운영자가 읽기" on public.profiles for select to authenticated
  using (exists (select 1 from public.group_members gm where gm.user_id = profiles.id and public.is_group_staff(gm.group_id)));

-- 멤버·장비·캠핑: "누구나" 정책을 모임 기준으로 바꾼다. 비로그인(anon)은 더 이상 쓸 수 없다.
drop policy if exists "people: 누구나" on public.people;
drop policy if exists "equipments: 누구나" on public.equipments;
drop policy if exists "camps: 누구나" on public.camps;
revoke all on public.people, public.equipments, public.camps from anon;

-- 멤버: 모임 구성원은 보고, 관리자·운영진은 누구든 만들고 고치고 지운다. 일반 멤버는 본인만 만들고 고친다(지우기 불가).
create policy "people: 모임 구성원 읽기" on public.people for select to authenticated using (public.is_group_member(group_id));
create policy "people: 운영자 또는 본인 등록" on public.people for insert to authenticated
  with check (public.is_group_staff(group_id) or (user_id = auth.uid() and public.is_group_member(group_id)));
create policy "people: 운영자 또는 본인 수정" on public.people for update to authenticated
  using (public.is_group_staff(group_id) or (user_id = auth.uid() and public.is_group_member(group_id)))
  with check (public.is_group_staff(group_id) or (user_id = auth.uid() and public.is_group_member(group_id)));
create policy "people: 운영자만 삭제" on public.people for delete to authenticated using (public.is_group_staff(group_id));

-- 장비: 주인(멤버)을 따라간다.
create policy "equipments: 모임 구성원 읽기" on public.equipments for select to authenticated
  using (exists (select 1 from public.people p where p.id = equipments.person_id and public.is_group_member(p.group_id)));
create policy "equipments: 운영자 또는 본인 쓰기" on public.equipments for all to authenticated
  using (exists (select 1 from public.people p where p.id = equipments.person_id
    and (public.is_group_staff(p.group_id) or (p.user_id = auth.uid() and public.is_group_member(p.group_id)))))
  with check (exists (select 1 from public.people p where p.id = equipments.person_id
    and (public.is_group_staff(p.group_id) or (p.user_id = auth.uid() and public.is_group_member(p.group_id)))));

-- 캠핑: 모임 구성원이면 누구나 만들고 고친다.
create policy "camps: 모임 구성원" on public.camps for all to authenticated
  using (public.is_group_member(group_id)) with check (public.is_group_member(group_id));
