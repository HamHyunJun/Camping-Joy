-- 장비 이름(모델명). 텐트를 등록할 때 '코베아 고스트'처럼 적는다.
alter table public.equipments
  add column if not exists model text check (model is null or char_length(model) <= 30);
