-- 캠핑 링크 공유 (로그인 없음)
-- 기기마다 Supabase 익명 로그인으로 받은 ID(auth.uid())로 구분한다.
-- - 캠핑을 만든 기기(owner): 모두 수정·삭제
-- - 링크로 들어온 기기(camp_access): 보기 + 자기 멤버의 장비 수정 + 자기 담당 장비 준비 체크
-- - 링크가 없는 기기: 아무것도 못 봄

create extension if not exists pgcrypto with schema extensions;

-- 테이블 ------------------------------------------------------------------

create table public.camps (
  id uuid primary key default gen_random_uuid(),
  -- 링크에 들어가는 추측 불가능한 값 (24자, URL에 바로 쓸 수 있는 문자만)
  share_token text not null unique default translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/', '-_'),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 링크로 들어온 기기
create table public.camp_access (
  camp_id uuid not null references public.camps (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (camp_id, user_id)
);

create table public.camp_members (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null references public.camps (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  position int not null default 0,
  -- "나는 민지"를 고른 기기
  device_id uuid references auth.users (id) on delete set null,
  unique (camp_id, name),
  unique (id, camp_id)
);
-- 한 기기는 한 캠핑에서 한 멤버만 고를 수 있다.
create unique index camp_members_one_per_device on public.camp_members (camp_id, device_id) where device_id is not null;

-- 멤버가 가진 장비 (캠핑을 올릴 때 기기의 등록 장비를 복사)
create table public.camp_gear (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null,
  member_id uuid not null,
  name text not null check (char_length(name) between 1 and 30),
  category text not null check (category in ('shelter', 'furniture', 'kitchen', 'sleeping', 'lighting', 'etc')),
  size text check (size is null or char_length(size) <= 20),
  quantity int not null check (quantity between 1 and 99),
  unique (id, camp_id),
  foreign key (member_id, camp_id) references public.camp_members (id, camp_id) on delete cascade
);

-- 이번 캠핑에 챙길 장비 (배분). 챙기는 사람은 장비 주인(camp_gear.member_id)
create table public.camp_items (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid not null,
  gear_id uuid not null unique,
  quantity int not null check (quantity >= 1),
  ready boolean not null default false,
  foreign key (gear_id, camp_id) references public.camp_gear (id, camp_id) on delete cascade
);

create index on public.camp_members (camp_id);
create index on public.camp_gear (camp_id);
create index on public.camp_items (camp_id);

-- 권한 판단 함수 (RLS 안에서 다른 테이블을 볼 때 재귀를 피하려고 security definer) ---------

create function public.is_camp_owner(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.camps where id = target and owner_id = auth.uid());
$$;

create function public.can_view_camp(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_camp_owner(target)
    or exists (select 1 from public.camp_access where camp_id = target and user_id = auth.uid());
$$;

-- 이 기기가 고른 멤버
create function public.my_member_id(target uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.camp_members where camp_id = target and device_id = auth.uid();
$$;

-- RLS ---------------------------------------------------------------------

alter table public.camps enable row level security;
alter table public.camp_access enable row level security;
alter table public.camp_members enable row level security;
alter table public.camp_gear enable row level security;
alter table public.camp_items enable row level security;

create policy "camps: 볼 수 있는 캠핑" on public.camps for select to authenticated
  using (public.can_view_camp(id));
create policy "camps: 내가 만들기" on public.camps for insert to authenticated
  with check (owner_id = auth.uid());
create policy "camps: 만든 기기만 수정" on public.camps for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "camps: 만든 기기만 삭제" on public.camps for delete to authenticated
  using (owner_id = auth.uid());

create policy "camp_access: 내 기록과 만든 기기" on public.camp_access for select to authenticated
  using (user_id = auth.uid() or public.is_camp_owner(camp_id));
create policy "camp_access: 나가기" on public.camp_access for delete to authenticated
  using (user_id = auth.uid() or public.is_camp_owner(camp_id));

create policy "camp_members: 보기" on public.camp_members for select to authenticated
  using (public.can_view_camp(camp_id));
create policy "camp_members: 만든 기기만 추가" on public.camp_members for insert to authenticated
  with check (public.is_camp_owner(camp_id));
create policy "camp_members: 만든 기기만 수정" on public.camp_members for update to authenticated
  using (public.is_camp_owner(camp_id)) with check (public.is_camp_owner(camp_id));
create policy "camp_members: 만든 기기만 삭제" on public.camp_members for delete to authenticated
  using (public.is_camp_owner(camp_id));

create policy "camp_gear: 보기" on public.camp_gear for select to authenticated
  using (public.can_view_camp(camp_id));
create policy "camp_gear: 만든 기기나 자기 장비 추가" on public.camp_gear for insert to authenticated
  with check (public.is_camp_owner(camp_id) or member_id = public.my_member_id(camp_id));
create policy "camp_gear: 만든 기기나 자기 장비 수정" on public.camp_gear for update to authenticated
  using (public.is_camp_owner(camp_id) or member_id = public.my_member_id(camp_id))
  with check (public.is_camp_owner(camp_id) or member_id = public.my_member_id(camp_id));
create policy "camp_gear: 만든 기기나 자기 장비 삭제" on public.camp_gear for delete to authenticated
  using (public.is_camp_owner(camp_id) or member_id = public.my_member_id(camp_id));

create policy "camp_items: 보기" on public.camp_items for select to authenticated
  using (public.can_view_camp(camp_id));
create policy "camp_items: 만든 기기만 추가" on public.camp_items for insert to authenticated
  with check (public.is_camp_owner(camp_id));
create policy "camp_items: 만든 기기만 수정" on public.camp_items for update to authenticated
  using (public.is_camp_owner(camp_id)) with check (public.is_camp_owner(camp_id));
create policy "camp_items: 만든 기기만 삭제" on public.camp_items for delete to authenticated
  using (public.is_camp_owner(camp_id));

-- 트리거 ------------------------------------------------------------------

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger camps_touch before update on public.camps
  for each row execute function public.touch_updated_at();

-- 멤버가 자기 장비 수량을 줄이면, 챙길 수량도 보유 수량을 넘지 않게 줄인다.
create function public.clamp_items_to_gear() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.camp_items set quantity = new.quantity
    where gear_id = new.id and quantity > new.quantity;
  return new;
end;
$$;

create trigger camp_gear_clamp after update of quantity on public.camp_gear
  for each row execute function public.clamp_items_to_gear();

-- 함수(RPC) ----------------------------------------------------------------

-- 링크로 들어오기. 캠핑 id를 돌려준다. 링크가 틀리면 null.
create function public.join_camp(token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  target uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  select id into target from public.camps where share_token = token;
  if target is null then
    return null;
  end if;
  if not public.is_camp_owner(target) then
    insert into public.camp_access (camp_id, user_id) values (target, auth.uid())
      on conflict do nothing;
  end if;
  return target;
end;
$$;

-- "나는 민지" 고르기. member가 null이면 선택을 푼다. 다른 기기가 이미 고른 멤버는 고를 수 없다.
create function public.claim_member(target_camp uuid, member uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_view_camp(target_camp) then
    raise exception 'no access';
  end if;
  update public.camp_members set device_id = null
    where camp_id = target_camp and device_id = auth.uid();
  if member is null then
    return;
  end if;
  update public.camp_members set device_id = auth.uid()
    where id = member and camp_id = target_camp and device_id is null;
  if not found then
    raise exception 'member already taken';
  end if;
end;
$$;

-- 준비 완료 체크. 만든 기기 또는 그 장비를 챙기는 멤버만.
create function public.set_item_ready(item uuid, value boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  target_camp uuid;
  holder uuid;
begin
  select i.camp_id, g.member_id into target_camp, holder
    from public.camp_items i join public.camp_gear g on g.id = i.gear_id
    where i.id = item;
  if target_camp is null then
    raise exception 'item not found';
  end if;
  if not (public.is_camp_owner(target_camp) or holder = public.my_member_id(target_camp)) then
    raise exception 'not allowed';
  end if;
  update public.camp_items set ready = value where id = item;
end;
$$;

-- 링크 다시 만들기. 기존 링크로 들어온 기기는 모두 빠진다.
create function public.rotate_share_token(target_camp uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  token text;
begin
  if not public.is_camp_owner(target_camp) then
    raise exception 'not allowed';
  end if;
  token := translate(encode(extensions.gen_random_bytes(18), 'base64'), '+/', '-_');
  update public.camps set share_token = token where id = target_camp;
  update public.camp_members set device_id = null where camp_id = target_camp;
  delete from public.camp_access where camp_id = target_camp;
  return token;
end;
$$;

revoke execute on function public.join_camp, public.claim_member, public.set_item_ready, public.rotate_share_token from public, anon;
grant execute on function public.join_camp, public.claim_member, public.set_item_ready, public.rotate_share_token to authenticated;

-- 실시간 반영 ---------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.camps, public.camp_members, public.camp_gear, public.camp_items;
  end if;
end;
$$;
