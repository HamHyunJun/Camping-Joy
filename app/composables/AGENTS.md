# composables

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
외부 서비스 연결을 감싸는 함수. `useSupabase()`는 Nuxt가 자동 import 하고, `useNaverMaps.ts`는 default 객체(`naverMaps.geocodeAddress(...)` 등)를 명시 import 해서 쓴다. 둘 다 키가 없으면 기능을 끄는 방식이라 환경 변수 없이도 앱이 동작한다.

## Key Files
| File | Description |
|------|-------------|
| `useSupabase.ts` | 싱글턴 `SupabaseClient<Database>`. `runtimeConfig.public.supabaseUrl/Key`가 없으면 `null`. 로그인이 없어 `persistSession: false` |
| `useNaverMaps.ts` | 네이버 지도 JS API v3를 한 번만 동적 로드(`loadNaverMaps`, geocoder 서브모듈 포함), `hasNaverMapKey`, `geocodeAddress`(주소 → 좌표, 없으면 null), `openNaverMap`(네이티브는 `location.href`, 웹은 새 탭). 앱에서 쓰는 API 부분만 로컬 타입으로 선언 |

## For AI Agents

### Working In This Directory
- Supabase 클라이언트는 `useSupabase()`로만 얻는다. 직접 `createClient` 하지 않는다. 호출하는 곳은 동기화 플러그인뿐이어야 한다.
- `null` 반환(키 없음)을 반드시 처리한다.
- 네이버 지도 API에서 새 기능을 쓰면 `NaverMapsApi` 등 로컬 인터페이스에 필요한 부분만 타입을 추가한다(`any` 금지). 로드 실패 시 `loading`을 초기화해 재시도 가능하게 유지한다.

### Testing Requirements
- `pnpm typecheck`. 지도는 `NUXT_PUBLIC_NAVER_MAP_KEY_ID`가 있을 때/없을 때 둘 다 확인 (NCP 콘솔에 등록된 도메인에서만 인증 성공).

### Common Patterns
- 모듈 스코프 변수로 싱글턴/로딩 Promise를 캐시한다.

## Dependencies

### Internal
- `types/database.ts`, `../../nuxt.config.ts`(runtimeConfig)

### External
- `@supabase/supabase-js`, `@capacitor/core`, 네이버 지도 `https://oapi.map.naver.com/openapi/v3/maps.js`

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
