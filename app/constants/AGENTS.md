# constants

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
고정 데이터. 자동 import 되지 않으므로 `import { ... } from '~/constants/...'`로 쓴다.

## Key Files
| File | Description |
|------|-------------|
| `equipment.ts` | `EQUIPMENT_CATEGORY_LABELS`(키 순서 = 화면 표시 순서), `EQUIPMENT_PRESETS`(빠른 추가 버튼), `EQUIPMENT_SIZE_GUIDES`(텐트·테이블·아이스박스 크기 선택지, 장비 이름으로 조회) |
| `steps.ts` | `CAMP_STEPS`: info → members → distribute → schedule → result 와 라벨 |

## For AI Agents

### Working In This Directory
- 카테고리를 추가하면 `types/camp.ts`의 `EquipmentCategory`, DB의 `check (category in ...)` 마이그레이션도 함께 바꾼다.
- `CAMP_STEPS`의 `path`는 `pages/camps/[campId]/` 파일 이름과 같아야 하며, `utils/campSteps.ts`의 `isStepComplete` switch도 맞춘다.
- 크기 가이드 키는 장비 이름(trim 후)과 정확히 일치해야 한다.

### Testing Requirements
- `pnpm typecheck`.

## Dependencies

### Internal
- `types/camp.ts`

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
