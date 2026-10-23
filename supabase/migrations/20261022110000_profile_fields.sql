-- 첫 로그인 때 정하는 프로필(닉네임·인사말·프로필 이미지). 이미지는 이모지 하나를 고른다.
alter table public.profiles
  add column if not exists nickname text check (char_length(nickname) between 1 and 12),
  add column if not exists greeting text check (char_length(greeting) <= 30),
  add column if not exists avatar text check (char_length(avatar) <= 8);

-- 본인 행만 만들고 고친다. (가입 트리거가 만든 행이 없는 계정도 저장할 수 있게 insert도 허용한다)
drop policy if exists "profiles: 본인만 쓰기" on public.profiles;
create policy "profiles: 본인만 쓰기" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles: 본인만 고치기" on public.profiles;
create policy "profiles: 본인만 고치기" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

grant insert (id, nickname, greeting, avatar), update (nickname, greeting, avatar) on public.profiles to authenticated;
