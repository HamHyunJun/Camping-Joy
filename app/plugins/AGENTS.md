# plugins

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
클라이언트 전용(`.client.ts`) Nuxt 플러그인. Supabase와 스토어를 맞추는 동기화 두 개와 안드로이드 뒤로가기 처리.

## Key Files
| File | Description |
|------|-------------|
| `gearSync.client.ts` | `gear.people` ↔ `people`/`equipments` 테이블. 처음 연결한 기기는 로컬 등록을 서버에 합치고(같은 이름은 서버 사람으로 `remapPerson`), Realtime 채널 `gear` 구독 |
| `campSync.client.ts` | `camp.camps` ↔ `camps` 테이블(멤버·배분·준비·일정·캠핑장은 `data` jsonb). 빈 초안 캠핑은 올리지 않음. Realtime 채널 `camps` 구독 |
| `capacitor.client.ts` | 안드로이드 하드웨어 뒤로가기: 홈이 아니고 뒤로 갈 수 있으면 `router.back()`, 아니면 `App.exitApp()` |

## For AI Agents

### Working In This Directory
- 동기화 알고리즘(큰 틀은 같지만 아래 "두 파일의 차이"를 확인할 것):
  1. `start()`: 서버 목록 fetch → `apply()`로 스토어 교체 + **baseline**(id → 행 JSON) 저장 → `ready = true`.
  2. 스토어 deep watch → `schedulePush()` 600ms 디바운스 → baseline과 비교해 **바뀐 행만 upsert, 사라진 행만 delete** → baseline 갱신.
  3. Realtime 이벤트·`visibilitychange`(visible) → `scheduleRefresh()` 300ms → `refresh()`. 실행 중인 push가 있으면 끝나길 기다린 뒤, 그 사이 새 push 타이머가 걸렸으면 **fetch 없이 그대로 끝낸다**(미뤄지는 것이 아니라 버려진다). 이후 push가 끝난 뒤의 알림이나 화면 복귀가 다시 refresh를 부른다.
  4. push·refresh 중 네트워크 오류는 삼키고 로컬 상태로 계속 동작한다.
  5. 예외: `start()`의 첫 fetch가 실패하면 `ready`가 false로 남아 **Realtime 구독·`visibilitychange` 리스너가 등록되지 않고 push도 일어나지 않는다**(앱을 다시 열어야 재시도).
- 두 파일의 차이:
  - `campSync`: 처음 연결한 기기는 모든 로컬 캠핑을 `synced = false`로 돌린 뒤, `apply()` 직후 `push()`를 바로 호출해 서버에 없는 캠핑을 올린다. 빈 초안 캠핑은 올리지 않는다.
  - `gearSync`: `apply()` 전에 로컬 등록을 서버 목록과 합친다(같은 이름은 서버 사람으로 `remapPerson`). 합친 뒤 `apply()`만 하고 `push()`는 따로 호출하지 않는다.
- 전체 덮어쓰기(upsert all)로 바꾸지 말 것 — 다른 사람의 동시 수정을 지운다.
- `useSupabase()`가 `null`이면 즉시 return (로컬 전용 모드).
- 필드를 추가하면 `toRow`/`fromRow`(또는 `toRows`/`fetchPeople`)와 `types/database.ts`, 마이그레이션을 함께 고친다. 문자열은 DB 제약 길이로 `slice` 한다.
- 사람 삭제 시 장비는 DB `on delete cascade`로 지워지므로 `removedEquipments`에서 제외한다.
- `meId`는 기기별 값이라 동기화하지 않는다.

### Testing Requirements
- `.env`에 `NUXT_PUBLIC_SUPABASE_URL`/`NUXT_PUBLIC_SUPABASE_KEY`를 넣고 브라우저 두 개로 동시 수정·실시간 반영 확인. 오프라인 전환 후 복구도 확인. `pnpm typecheck`.

### Common Patterns
- `pushTimer`/`pushing`/`refreshTimer` 세 상태로 push와 refresh 경합을 막는다.

## Dependencies

### Internal
- `composables/useSupabase.ts`, `stores/camp.ts`, `stores/gear.ts`, `types/camp.ts`, `types/database.ts`, `../supabase/migrations/`

### External
- `@supabase/supabase-js` (Realtime `postgres_changes`), `@capacitor/app`, `@capacitor/core`

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
