-- 권한 시나리오: A=캠핑 만든 기기, B·C=링크로 들어온 기기
\set ON_ERROR_STOP 0
\set A '''00000000-0000-0000-0000-00000000000a'''
\set B '''00000000-0000-0000-0000-00000000000b'''
\set C '''00000000-0000-0000-0000-00000000000c'''
-- A(owner) creates camp, members 현준(A)/민지/서연, gear, items
set role authenticated; select set_config('request.jwt.claim.sub', :A, false);
insert into camps (name, date) values ('자라섬', '2026-10-10') returning name as "A insert returning";
insert into camp_members (camp_id, name, position) select id, n, p from camps, (values ('현준',0),('민지',1),('서연',2)) v(n,p);
insert into camp_gear (camp_id, member_id, name, category, quantity) select m.camp_id, m.id, g, 'kitchen', 2 from camp_members m, (values ('버너'),('코펠')) v(g);
insert into camp_items (camp_id, gear_id, quantity) select camp_id, id, 2 from camp_gear;
select 'A sees items', count(*) from camp_items;
select share_token as tok from camps \gset
-- B without link sees nothing
select set_config('request.jwt.claim.sub', :B, false);
select 'B before join camps', count(*) from camps;
select 'B join with wrong token', join_camp('nope');
select 'B join', join_camp(:'tok') is not null;
select 'B sees camps/members/items', (select count(*) from camps), (select count(*) from camp_members), (select count(*) from camp_items);
-- B tries owner actions
update camps set name='hack'; select 'B rename camp rows', (select name from camps);
delete from camp_members; select 'B delete members ->', count(*) from camp_members;
update camp_items set quantity = 1; select 'B update items qty', sum(quantity) from camp_items;
-- B claims 민지
select claim_member((select id from camps), (select id from camp_members where name='민지'));
select 'B member', name from camp_members where device_id = auth.uid();
-- B edits own gear, not others
update camp_gear set quantity = 1 where member_id = my_member_id((select id from camps)) and name='버너';
update camp_gear set quantity = 1 where member_id <> coalesce(my_member_id((select id from camps)), gen_random_uuid());
select 'gear qty by member', m.name, g.name, g.quantity from camp_gear g join camp_members m on m.id=g.member_id order by 2,3;
select 'items clamped (민지 버너 should be 1)', m.name, g.name, i.quantity from camp_items i join camp_gear g on g.id=i.gear_id join camp_members m on m.id=g.member_id where m.name='민지' order by 3;
insert into camp_gear (camp_id, member_id, name, category, quantity) select id, my_member_id(id), '랜턴', 'lighting', 1 from camps;
insert into camp_gear (camp_id, member_id, name, category, quantity) select id, (select id from camp_members where name='서연'), '해킹', 'etc', 1 from camps;
select 'B gear add own ok / others blocked', count(*) filter (where name='랜턴'), count(*) filter (where name='해킹') from camp_gear;
-- ready
select set_item_ready((select i.id from camp_items i join camp_gear g on g.id=i.gear_id where g.member_id = my_member_id(i.camp_id) limit 1), true);
select set_item_ready((select i.id from camp_items i join camp_gear g on g.id=i.gear_id join camp_members m on m.id=g.member_id where m.name='서연' limit 1), true);
select 'ready rows', count(*) filter (where ready) from camp_items;
-- C joins, tries to claim 민지 (taken)
select set_config('request.jwt.claim.sub', :C, false);
select join_camp(:'tok') is not null as c_joined;
select claim_member((select id from camps), (select id from camp_members where name='민지'));
select claim_member((select id from camps), (select id from camp_members where name='서연'));
select 'C member', name from camp_members where device_id = auth.uid();
select 'C sees camp_access rows', count(*) from camp_access;
-- A rotates token -> B, C lose access
select set_config('request.jwt.claim.sub', :A, false);
select 'A sees access rows', count(*) from camp_access;
select rotate_share_token((select id from camps)) <> :'tok' as rotated;
select set_config('request.jwt.claim.sub', :B, false);
select 'B after rotate camps', count(*) from camps;
-- anon role cannot call rpc
reset role; set role anon; select join_camp(:'tok');
reset role;
