# supabase

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
Supabase(Postgres) 스키마 마이그레이션. Supabase CLI 연동 설정은 없고, 대시보드 SQL Editor에서 `migrations/` 파일을 이름 순서대로 실행한다.

## Key Files
| File | Description |
|------|-------------|
| `migrations/20261007100000_shared_gear.sql` | 예전 설계(캠핑 링크 공유) 테이블·함수 drop, `people`·`equipments` 생성(길이·수량·카테고리 check, `on delete cascade`), RLS + anon 전체 허용 정책, Realtime publication 추가 |
| `migrations/20261007110000_shared_camps.sql` | `camps`(id, name ≤50, date, `data` jsonb, created_at, updated_at), RLS + anon 전체 허용, Realtime |
| `migrations/20261007120000_equipment_model.sql` | `equipments.model`(≤30) 컬럼 추가 |

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
