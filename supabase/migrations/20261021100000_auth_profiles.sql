-- Camping&Joy: 로그인(Supabase Auth). 계정은 auth.users가 관리하고, 아이디(username)만 profiles에 둔다.
-- 캠핑·장비 데이터의 RLS는 그대로(누구나)이고, 로그인은 앱 화면에서만 요구한다.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- 카카오 로그인 계정은 아이디가 없다.
  username text unique check (username ~ '^[a-z0-9_]{4,20}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "profiles: 본인만 읽기" on public.profiles;
create policy "profiles: 본인만 읽기" on public.profiles for select to authenticated using (auth.uid() = id);
grant select on public.profiles to authenticated;

-- 가입할 때 보낸 username(user_metadata)으로 profiles 행을 만든다.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username) values (new.id, lower(new.raw_user_meta_data ->> 'username'));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 로그인 화면용: 아이디로 이메일을 찾는다. (로그인 전이라 anon이 호출한다)
create or replace function public.email_for_username(p_username text) returns text
language sql stable security definer set search_path = public, auth as $$
  select u.email::text from public.profiles p join auth.users u on u.id = p.id where p.username = lower(p_username)
$$;

-- 회원가입 화면용: 아이디가 이미 쓰이는지 확인한다.
create or replace function public.username_taken(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where username = lower(p_username))
$$;

revoke all on function public.email_for_username(text), public.username_taken(text) from public;
grant execute on function public.email_for_username(text), public.username_taken(text) to anon, authenticated;
