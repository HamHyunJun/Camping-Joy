-- 관리자(owner) 위임. 관리자만 할 수 있고, 가입이 끝난 다른 구성원에게만 넘긴다.
-- 관리자는 모임마다 한 명(group_members_one_owner)이라 먼저 기존 관리자를 운영진으로 내린 뒤 올린다.
create or replace function public.transfer_ownership(g uuid, u uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.group_role(g) is distinct from 'owner' then raise exception 'not allowed'; end if;
  if u = auth.uid() then raise exception 'cannot transfer to yourself'; end if;
  if not exists (select 1 from public.group_members where group_id = g and user_id = u and role in ('admin', 'member')) then
    raise exception 'cannot transfer to this member';
  end if;
  update public.group_members set role = 'admin' where group_id = g and user_id = auth.uid();
  update public.group_members set role = 'owner' where group_id = g and user_id = u;
end $$;

revoke all on function public.transfer_ownership(uuid, uuid) from public, anon;
grant execute on function public.transfer_ownership(uuid, uuid) to authenticated;
