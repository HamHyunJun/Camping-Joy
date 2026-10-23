-- 프로필 이미지: avatars 버킷에 올린 파일의 경로(<user_id>/<파일>)를 profiles.avatar에 둔다. 비어 있으면 기본 이미지(텐트)를 쓴다.
-- 이모지를 고르던 때 저장된 값은 파일 경로가 아니므로 비워서 기본 이미지(텐트)로 돌린다.
update public.profiles set avatar = null where avatar is not null and position('/' in avatar) = 0;

alter table public.profiles drop constraint if exists profiles_avatar_check;
alter table public.profiles add constraint profiles_avatar_check check (avatar is null or char_length(avatar) <= 100);

-- 읽기는 누구나(공개 버킷), 쓰기는 본인 폴더만. 앱이 256px로 줄여 올리므로 1MB로 충분하다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars: 본인 폴더 읽기" on storage.objects;
create policy "avatars: 본인 폴더 읽기" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars: 본인 폴더 올리기" on storage.objects;
create policy "avatars: 본인 폴더 올리기" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars: 본인 폴더 지우기" on storage.objects;
create policy "avatars: 본인 폴더 지우기" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
