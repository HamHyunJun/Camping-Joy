-- 카카오 로그인만 쓰므로 아이디·이메일 가입용 함수를 지운다. (anon이 호출할 수 있어서 남겨 둘 이유가 없다)
drop function if exists public.email_for_username(text);
drop function if exists public.username_taken(text);
drop function if exists public.email_taken(text);
