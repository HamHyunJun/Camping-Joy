# supabase

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
Supabase(Postgres) 스키마 마이그레이션. Supabase CLI 연동 설정은 없고, 대시보드 SQL Editor에서 `migrations/` 파일을 이름 순서대로 실행한다.

## Key Files
| File | Description |
|------|-------------|
| `migrations/20261007100000_shared_gear.sql` | 예전 설계(캠핑 링크 공유) 테이블·함수 drop, `people`·`equipments` 생성(길이·수량·카테고리 check, `on delete cascade`), RLS, Realtime publication 추가 |
| `migrations/20261007110000_shared_camps.sql` | `camps`(id, name ≤50, date, `data` jsonb, created_at, updated_at), RLS, Realtime |
| `migrations/20261007120000_equipment_model.sql` | `equipments.model`(≤30) 컬럼 추가 |
| `migrations/20261021100000_auth_profiles.sql` | `profiles`(id → auth.users), 가입 시 profiles 생성 트리거 |
| `migrations/20261021110000_email_taken.sql` | (이메일 가입 시절) `email_taken` 함수. 다음 마이그레이션에서 삭제됨 |
| `migrations/20261022100000_drop_password_login_functions.sql` | 카카오 로그인만 쓰게 되어 `email_for_username`·`username_taken`·`email_taken` 삭제 |
| `migrations/20261022110000_profile_fields.sql` | `profiles`에 `nickname`·`greeting`·`avatar` 추가, 본인 행 insert·update 정책 |
| `migrations/20261022120000_people_user_id.sql` | `people.user_id`(auth.users): 로그인 계정과 멤버 카드 연결 |
| `migrations/20261022130000_avatar_storage.sql` | `avatars` 공개 버킷(1MB, jpeg·png·webp)과 본인 폴더(`<user_id>/`)만 읽기·올리기·지우기 정책. `profiles.avatar`는 파일 경로, 비면 기본 텐트 |
| `migrations/20261023100000_groups.sql` | 모임: `groups`, `group_members`(owner·admin·member·pending), 역할 확인 함수, `create_group`·`request_join`·`decide_join`·`set_member_role`. `people`·`camps`에 `group_id`를 붙여 기존 데이터를 첫 모임(Camping&Joy)에 담고, "누구나" 정책을 모임 구성원·역할 기준 RLS로 교체(anon 차단). 관리자는 첫 로그인 뒤 SQL로 지정 |
| `migrations/20261023110000_remove_group_member.sql` | `remove_group_member`: 구성원 내보내기(관리자는 관리자 외 누구나, 운영진은 일반 멤버만). 그 계정의 멤버 카드는 지우지 않고 연결만 끊는다 |
| `migrations/20261024100000_cancel_join.sql` | `cancel_join`: 본인의 승인 대기(pending) 가입 신청만 취소. 승인된 소속은 건드리지 않는다 |
| `migrations/20261025100000_group_name_unique_delete.sql` | 모임 이름 유일 인덱스(`lower(name)`)와 `delete_group`(관리자만, 멤버·장비·캠핑이 cascade로 함께 삭제) |
| `migrations/20261026100000_group_profile.sql` | `groups.description`(≤100)·`region`(전국+시도 check), `create_group(이름, 설명, 지역)`, `group_member_counts()`(가입 신청 제외 인원, 비구성원도 볼 수 있게 security definer) |
| `migrations/20261027100000_update_group.sql` | `update_group`: 모임 설명·지역 수정(관리자만) |

## 로컬 개발 DB
- 개발은 운영 DB가 아니라 로컬 Supabase(Docker)를 쓴다. 운영 값은 `.env.remote`(git 제외)에 보관한다.
- `colima start` → `pnpm dlx supabase@latest start -x edge-runtime,imgproxy,logflare,vector,supavisor` (처음 한 번은 이미지를 내려받는다). 마이그레이션은 시작할 때 자동 적용된다.
- `.env`는 `NUXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`과 로컬 publishable 키(`supabase status`)를 쓴다. 스튜디오 `http://127.0.0.1:54323`, 메일함 `http://127.0.0.1:54324`.
- 초기화: `pnpm dlx supabase@latest db reset`. 종료: `pnpm dlx supabase@latest stop`.

## For AI Agents

### Working In This Directory
- 이미 적용된 마이그레이션은 고치지 말고 새 파일(`YYYYMMDDHHMMSS_설명.sql`)을 추가한다. `add column if not exists`처럼 다시 실행해도 안전하게 쓴다.
- 스키마를 바꾸면 `app/types/database.ts`, 동기화 플러그인(`app/plugins/*Sync.client.ts`)의 행 변환, 앱의 입력 길이 제한을 함께 맞춘다.
- 로그인이 없어 RLS 정책은 의도적으로 `using (true) with check (true)`다(누구나 읽기·쓰기). 보안 강화는 앱 설계 변경이 필요하니 임의로 바꾸지 말고 먼저 확인한다.
- 새 테이블을 실시간으로 반영하려면 `supabase_realtime` publication에 추가하는 블록을 같은 형식으로 넣는다.
- service_role 키나 비밀값을 SQL·코드에 넣지 않는다.
- 원격 DB에 직접 적용(MCP `apply_migration` 등)은 사용자 확인 후에만 한다.

### Testing Requirements
- 로컬/브랜치 DB에서 SQL 실행 후 앱의 동기화가 동작하는지 확인.

## Dependencies

### Internal
- `../app/types/database.ts`, `../app/plugins/gearSync.client.ts`, `../app/plugins/campSync.client.ts`

### External
- Supabase Postgres, Realtime

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
