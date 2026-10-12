# pages

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
Nuxt 파일 기반 라우트. 홈(캠핑 목록), 멤버·장비 등록, 지난 캠핑, 그리고 캠핑 하나를 만드는 5단계 화면(`camps/[campId]/`)이 있다.

## Key Files
| File | Route | Description |
|------|-------|-------------|
| `index.vue` | `/` | 다가올 캠핑 목록, "나는 ○○"(`store.meId`) 선택 시 내가 참여한 캠핑을 따로 표시, "+ 새 캠핑". 진입 시 `removeEmptyDrafts()`로 빈 캠핑 삭제 |
| `gear.vue` | `/gear` | 멤버(사람) 추가·이름 검색, 사람별 `PersonGearCard` 목록 |
| `camps/past.vue` | `/camps/past` | 지난 캠핑(`store.pastCamps`) 목록 |
| `camps/[campId]/info.vue` | ① | 캠핑명·캠핑장(이름·주소)·날짜 입력. 캠핑명·날짜 필수. `PlaceMap`으로 위치 표시 |
| `camps/[campId]/members.vue` | ② | 등록된 사람 중 이번 캠핑 멤버 선택. 등록되지 않은 이름은 추가 불가 |
| `camps/[campId]/distribute.vue` | ③ | 멤버들이 가진 장비(pool)를 "공통으로 챙길 장비"로 드래그/+ 추가. `definePageMeta({ wide: true })` |
| `camps/[campId]/schedule.vue` | ④ | n일차·30분 단위 일정. 빠른 입력 프리셋(집합·입실·점심…). 비워도 다음 단계로 진행 가능 |
| `camps/[campId]/result.vue` | ⑤ | 캠핑 정보·일정·장비별/멤버별 배분표, 준비 완료 체크, 안 챙기는 장비, `ShareSheet` |

## For AI Agents

### Working In This Directory
- 단계 순서·라벨은 `~/constants/steps.ts`, 진입 가능 여부는 `utils/campSteps.ts`의 `isStepComplete`/`canVisitStep`이 정한다. 단계를 추가·변경하면 두 곳과 `middleware/camp.global.ts`, `components/StepNav.vue`를 함께 확인한다.
- `camps/[campId]/*` 페이지는 미들웨어가 `store.selectCamp(campId)`를 이미 호출한 상태로 열린다. `store.currentCamp`를 쓰되 `null` 가능성은 타입상 처리한다.
- 단계 이동은 두 가지 방식이 쓰인다. `info.vue`는 저장 후 ``navigateTo(`/camps/${route.params.campId}/members`)``를 부르고, 나머지 단계 이동(이전/다음 버튼 등)은 `<NuxtLink>`다. 새 이동을 만들 때는 같은 화면의 기존 방식을 따른다.
- 삭제 확인은 현재 `confirm()`을 쓴다.
- 기본 `<select>` 대신 `SelectMenu` 컴포넌트를 쓴다.
- 넓은 레이아웃이 필요한 페이지만 `definePageMeta({ wide: true })` (`types/page-meta.d.ts`).

### Testing Requirements
- `pnpm dev`에서 단계 흐름(정보 → 멤버 → 배분 → 일정 → 결과)과 주소 직접 진입 시 리다이렉트를 확인. `pnpm typecheck`.

### Common Patterns
- `const store = useCampStore()`, `const gear = useGearStore()`를 페이지 상단에 두고 `computed`로 파생값을 만든다.
- 배분의 실제 데이터는 `Member.equipments`(멤버별 담당 장비)다. `Camp.assignments`/`requiredEquipments`는 예전 설계 필드로 화면에서는 쓰지 않는다(스토어 `removeMember`·`resetMembers`와 `campSync`의 `toRow`/`fromRow`는 아직 이 필드를 읽고 쓴다).
- 준비 완료 키는 `` `${memberId}:${equipmentId}` `` (`store.isReady`/`toggleReady`).

## Dependencies

### Internal
- `stores/camp.ts`, `stores/gear.ts`, `components/*`, `utils/*`, `constants/*`

### External
- `vue-draggable-plus` (`distribute.vue`)

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
