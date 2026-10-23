-- 가입 신청 취소. 본인의 승인 대기(pending) 신청만 지운다.
create or replace function public.cancel_join(g uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  delete from public.group_members where group_id = g and user_id = auth.uid() and role = 'pending';
end $$;

revoke all on function public.cancel_join(uuid) from public, anon;
grant execute on function public.cancel_join(uuid) to authenticated;
