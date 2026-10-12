# stores

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
Pinia 스토어 두 개. 앱 상태의 단일 출처이며 `persist: true`로 localStorage에 저장된다(`nuxt.config.ts`에서 storage를 localStorage로 지정 — 쿠키 4KB 제한 회피). 자동 import 되어 `useCampStore()`, `useGearStore()`로 쓴다.

## Key Files
| File | Description |
|------|-------------|
| `camp.ts` | `useCampStore`: `camps`, `currentCampId`, `meId`(이 기기 사용자, 서버에 안 올림), `syncedOnce`. getters `currentCamp`, `upcomingCamps`, `pastCamps`. 캠핑 CRUD, 멤버, 배분(`addMemberEquipment`/`removeMemberEquipment`/`assignedQuantity`), 준비 체크, 일정, 초기화, 동기화용 `replaceCamps`/`markSynced`, 등록 변경 전파(`syncMemberName`, `remapPerson`, `removePersonFromCamps`, `syncOwnerEquipments`) |
| `gear.ts` | `useGearStore`: `people`(사람별 보유 장비), `syncedOnce`. 사람 추가·이름 변경·삭제, 장비 추가(같은 이름·카테고리·크기·모델이면 수량 합침)·크기·모델명·수량 변경, 서버 목록 반영 `replacePeople` |

## For AI Agents

### Working In This Directory
- **두 스토어는 서로 연결돼 있다.** `gear`에서 사람·장비를 바꾸면 반드시 `useCampStore()`의 전파 액션(`syncMemberName`, `removePersonFromCamps`, `syncOwnerEquipments`)을 불러 모든 캠핑의 멤버·담당 장비를 맞춘다. 새 gear 액션도 이 규칙을 따른다.
- 캠핑 내용을 직접 바꾸는 액션은 관례적으로 `camp.updatedAt = now()`를 갱신한다. 다만 지금은 `updatedAt`을 읽는 곳이 없다(정렬은 `date`/`createdAt`, 동기화는 행 전체 JSON 비교). 충돌 판단·정렬 기준으로 믿지 말 것. 등록 변경 전파 액션(`syncMemberName`, `remapPerson`, `removePersonFromCamps`, `syncOwnerEquipments`)과 `deleteCamp`는 갱신하지 않는다.
- 배분 합계는 보유 수량을 넘지 않는다 (`assignedQuantity(owned.id) >= owned.quantity`면 추가 안 함).
- 입력 길이·범위 제한은 세 곳에서 따로 걸린다. 한 곳을 바꾸면 나머지도 확인한다.
  - DB 체크 제약(`supabase/migrations/`): 사람 이름 ≤20, 장비 이름 ≤30, 크기 ≤20, 모델 ≤30, 수량 1~99, 캠핑명 ≤50.
  - 동기화 플러그인의 `slice`/`clamp`: 올릴 때 위 제한에 맞춰 자른다(수량은 99로 제한).
  - 스토어·입력창: 스토어가 직접 제한하는 것은 모델명 30(`gear.ts`)과 일정 제목 40(`camp.ts`)뿐이고, 나머지 이름 길이는 입력창 `maxlength`가 맡는다.
  - 일정 제목 40은 DB 제약이 아니다(일정은 `camps.data` jsonb 안에 있어 앱만 제한한다).
  - 장비 수량은 스토어에 99 상한이 없어 기기 값과 서버 값이 달라질 수 있다(올릴 때만 99로 자름).
- 날짜는 로컬 기준 `YYYY-MM-DD` 문자열 (`today()`가 타임존 오프셋 보정).
- 상태 필드를 추가하면 persistedstate에 그대로 저장되므로, 예전 저장본에 없을 수 있음을 고려해 optional 처리 또는 `?? []` 기본값을 쓴다.

### Testing Requirements
- `pnpm typecheck`. 등록 변경이 캠핑에 전파되는지(이름 변경, 장비 삭제·수량 감소, 크기 변경으로 합쳐짐) 화면에서 확인.

### Common Patterns
- Options API 스타일 `defineStore(id, { state, getters, actions, persist: true })`.
- id는 `createId()`(`crypto.randomUUID()`).
- 준비 완료 키 `` `${memberId}:${equipmentId}` ``.

## Dependencies

### Internal
- `types/camp.ts`, `utils/id.ts`
- 사용처: `plugins/*Sync.client.ts`, `middleware/camp.global.ts`, 모든 페이지·컴포넌트

### External
- `pinia`, `pinia-plugin-persistedstate`

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
