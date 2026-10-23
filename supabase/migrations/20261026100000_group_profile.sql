-- 모임 설명·지역, 그리고 가입 인원 수.
alter table public.groups add column if not exists description text not null default '' check (char_length(description) <= 100);
alter table public.groups add column if not exists region text not null default '전국'
  check (region in ('전국', '서울', '경기', '인천', '강원', '충북', '충남', '대전', '세종', '전북', '전남', '광주', '경북', '경남', '대구', '울산', '부산', '제주'));

-- 이름만 받던 create_group을 설명·지역까지 받도록 바꾼다.
drop function if exists public.create_group(text);
create or replace function public.create_group(p_name text, p_description text default '', p_region text default '전국') returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  insert into public.groups (name, description, region) values (trim(p_name), trim(p_description), p_region) returning id into new_id;
  insert into public.group_members (group_id, user_id, role) values (new_id, auth.uid(), 'owner');
  return new_id;
end $$;

-- 모임 목록에 보이는 가입 인원. 구성원이 아니어도 숫자는 볼 수 있어야 해서 security definer로 센다(가입 신청 중은 제외).
create or replace function public.group_member_counts() returns table (group_id uuid, member_count int)
language sql stable security definer set search_path = public as $$
  select gm.group_id, count(*)::int from public.group_members gm where gm.role <> 'pending' group by gm.group_id
$$;

revoke all on function public.create_group(text, text, text), public.group_member_counts() from public, anon;
grant execute on function public.create_group(text, text, text), public.group_member_counts() to authenticated;
