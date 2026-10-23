-- 모임 설명·지역 수정. 관리자만 할 수 있다.
create or replace function public.update_group(g uuid, p_description text, p_region text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.group_role(g) is distinct from 'owner' then raise exception 'not allowed'; end if;
  update public.groups set description = trim(p_description), region = p_region where id = g;
end $$;

revoke all on function public.update_group(uuid, text, text) from public, anon;
grant execute on function public.update_group(uuid, text, text) to authenticated;
