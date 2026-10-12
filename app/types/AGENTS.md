# types

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
도메인 타입과 Supabase DB 타입. 개발 규칙상 데이터 구조는 여기서 먼저 정한다. 자동 import 되지 않으므로 `import type { ... } from '~/types/camp'`로 쓴다.

## Key Files
| File | Description |
|------|-------------|
| `camp.ts` | `ID`, `EquipmentCategory`, `Equipment`, `Person`, `Member`, `RequiredEquipment`, `Assignment`/`AssignmentStatus`, `ScheduleItem`, `CampPlace`, `Camp`, `AssignmentIssue` |
| `database.ts` | `PersonRow`, `EquipmentRow`, `CampRow`, `CampData`(camps.data jsonb 구조), supabase-js용 `Database` (gen types 형식을 손으로 맞춤) |
| `page-meta.d.ts` | `PageMeta.wide?: boolean` 확장 |

## For AI Agents

### Working In This Directory
- `database.ts`는 `supabase/migrations/`와 **손으로** 맞춘다. 컬럼을 추가·변경하면 양쪽을 함께 고친다. `EquipmentCategory` 값은 DB `check (category in (...))`와 `constants/equipment.ts`의 라벨과 일치해야 한다.
- `Equipment.id`는 보유 장비 id이며, `Member.equipments`의 항목도 같은 id를 쓴다(수량만 이번에 가져갈 수).
- `Member.id === Person.id`.
- `Camp.requiredEquipments`, `Camp.assignments`, `Assignment*`, `AssignmentIssue`는 예전 설계의 흔적이다. 저장 형식 호환을 위해 남아 있지만 현재 배분은 `Member.equipments`로 한다. 화면은 쓰지 않지만 `stores/camp.ts`의 `removeMember`·`resetMembers`와 `plugins/campSync.client.ts`의 `toRow`/`fromRow`가 `assignments`·`requiredEquipments`를 아직 읽고 쓰므로, 필드를 지우려면 그곳도 함께 고친다.
- 예전 저장본에 없을 수 있는 필드(`place`, `schedule`, `readyItems`, `synced`)는 optional로 둔다.

### Testing Requirements
- `pnpm typecheck`.

## Dependencies

### Internal
- 사용처: 거의 모든 파일. `../../supabase/migrations/`와 동기화 필요

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
