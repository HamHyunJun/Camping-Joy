-- 모임 이름은 대소문자 구분 없이 하나만 쓴다.
create unique index if not exists groups_name_lower_key on public.groups (lower(name));

-- 모임 삭제. 관리자만 할 수 있고, 멤버·장비·캠핑·구성원이 함께 지워진다(on delete cascade).
create or replace function public.delete_group(g uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.group_role(g) is distinct from 'owner' then raise exception 'not allowed'; end if;
  delete from public.groups where id = g;
end $$;

revoke all on function public.delete_group(uuid) from public, anon;
grant execute on function public.delete_group(uuid) to authenticated;
