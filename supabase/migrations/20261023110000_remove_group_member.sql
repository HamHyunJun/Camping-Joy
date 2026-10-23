-- 구성원 내보내기. 관리자는 관리자 외 누구나, 운영진은 일반 멤버만 내보낼 수 있다. 본인과 관리자는 내보낼 수 없다.
-- 내보낸 계정이 등록해 둔 멤버(장비 포함)는 지우지 않고 계정과의 연결만 끊는다. 다시 가입하면 이어서 쓸 수 있다.
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
end $$;

revoke all on function public.remove_group_member(uuid, uuid) from public, anon;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
