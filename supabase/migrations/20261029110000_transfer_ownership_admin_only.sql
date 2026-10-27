-- 관리자 위임은 운영진(admin)에게만 할 수 있게 좁힌다.
create or replace function public.transfer_ownership(g uuid, u uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.group_role(g) is distinct from 'owner' then raise exception 'not allowed'; end if;
  if u = auth.uid() then raise exception 'cannot transfer to yourself'; end if;
  if not exists (select 1 from public.group_members where group_id = g and user_id = u and role = 'admin') then
    raise exception 'cannot transfer to this member';
  end if;
  update public.group_members set role = 'admin' where group_id = g and user_id = auth.uid();
  update public.group_members set role = 'owner' where group_id = g and user_id = u;
end $$;
