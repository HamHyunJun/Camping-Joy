# utils

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
상태가 없는 순수 함수. Nuxt가 자동 import 하므로 페이지·컴포넌트·스토어에서 import 없이 쓴다(스토어에서는 명시 import 하기도 함).

## Key Files
| File | Description |
|------|-------------|
| `campSteps.ts` | `isStepComplete`, `canVisitStep`, `lastVisitableStep`, `campProgress`(목록에 보여줄 진행 상태·준비 개수) |
| `format.ts` | `formatDate`(한국어 날짜), `formatDday`, `formatDayDate`(n일차 날짜), `sortSchedule`, `scheduleGroups` |
| `shareText.ts` | `buildShareText`(메신저용 결과 문구), `sortByCategory` |
| `equipmentLabel.ts` | `equipmentLabel`('텐트 · 코베아 고스트 (2~3인용)'), `sizeGuideOf`, `hasModelName`(텐트만) |
| `groupByCategory.ts` | 카테고리 정의 순서로 장비를 묶고 빈 카테고리 제외 |
| `id.ts` | `createId()` → `crypto.randomUUID()` (DB uuid 컬럼과 호환) |
| `equipmentMatch.ts` | `isSameEquipment` — 현재 사용처 없음 |
| `distribute.ts` | `DistributeStrategy` 타입만 있음 (자동 배분 미구현) |
| `validateAssignments.ts` | `ValidateAssignments` 타입만 있음 (배분 점검 미구현) |

## For AI Agents

### Working In This Directory
- 여기에는 순수 함수만 둔다. 스토어·DOM·네트워크 접근 금지.
- 자동 import는 export 이름 기준이라 전역 이름 충돌에 주의한다.
- 날짜 문자열은 `` new Date(`${date}T00:00:00`) ``로 로컬 자정 기준으로 파싱한다 (UTC 파싱 방지).
- 카테고리 순서는 `EQUIPMENT_CATEGORY_LABELS`의 키 순서를 따른다.
- `distribute.ts`/`validateAssignments.ts`/`equipmentMatch.ts`는 예전 `Assignment` 설계용 미완성 코드다. 자동 배분·점검을 구현하려면 현재 데이터 모델(`Member.equipments`)에 맞출지 먼저 결정한다.

### Testing Requirements
- 테스트 러너 없음. `pnpm typecheck` 후 사용 화면에서 확인.

## Dependencies

### Internal
- `types/camp.ts`, `constants/equipment.ts`, `constants/steps.ts`

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
