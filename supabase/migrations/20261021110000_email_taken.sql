-- 회원가입 화면용: 이메일이 이미 가입돼 있는지 확인한다. (가입 전이라 anon이 호출한다)
create or replace function public.email_taken(p_email text) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from auth.users where lower(email) = lower(p_email))
$$;

revoke all on function public.email_taken(text) from public;
grant execute on function public.email_taken(text) to anon, authenticated;
