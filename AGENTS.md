# Camping-Joy

**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
Camping&Joy — 함께 캠핑 가는 사람들이 "누가 어떤 장비를 챙길지" 정하고 확인하는 서비스. Nuxt 4 SPA(`ssr: false`) 하나로 웹(Vercel)과 안드로이드·iOS 앱(Capacitor 8)을 함께 만든다. 로그인 없이 Supabase(Postgres + Realtime)로 모든 기기가 같은 캠핑·장비 목록을 공유하고, 서버 설정이 없으면 기기(localStorage)에만 저장한다. 사용자용 설명은 `README.md`에 자세히 있다.

## Key Files
| File | Description |
|------|-------------|
| `package.json` | 스크립트(`dev`, `build`, `generate`, `typecheck`, `android:sync`, `ios:sync` 등)와 의존성. 패키지 매니저는 pnpm |
| `nuxt.config.ts` | SPA 모드, Pinia·persistedstate(localStorage) 모듈, `runtimeConfig.public`(supabaseUrl/supabaseKey/naverMapKeyId), SCSS 전역 `@use breakpoints` 주입, `<head>` 메타 |
| `capacitor.config.ts` | `appId: com.campingjoy.app`(변경 불가), `webDir: .output/public`, SystemBars `insetsHandling: 'css'` |
| `tsconfig.json` | `.nuxt/` 생성 tsconfig 참조만 둔다 (`pnpm install` 후 `nuxt prepare`가 생성) |
| `pnpm-workspace.yaml` | 빌드 스크립트를 허용할 의존성(`esbuild`, `@parcel/watcher`) |
| `README.md` | 기능·구조·데이터 모델·동기화 방식·개발 규칙·배포 (한국어) |
| `.gitignore` | `.nuxt`, `.output`, `dist`, `.env*` 등 제외 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `app/` | Nuxt 앱 소스 전체 (see `app/AGENTS.md`) |
| `supabase/` | DB 테이블·RLS·Realtime 마이그레이션 SQL (see `supabase/AGENTS.md`) |
| `android/` | Capacitor 안드로이드 네이티브 프로젝트 (see `android/AGENTS.md`) |
| `ios/` | Capacitor iOS 네이티브 프로젝트 (see `ios/AGENTS.md`) |
| `.github/` | 안드로이드 APK·iOS 빌드 GitHub Actions (see `.github/AGENTS.md`) |
| `assets/` | 앱 아이콘·스플래시 원본 이미지 (see `assets/AGENTS.md`) |
| `public/` | 정적 파일 (`favicon.svg`) |

생성물이라 손대지 않는 곳: `.nuxt/`, `.output/`, `dist`(→ `.output/public` 심볼릭 링크), `node_modules/`, `.omc/`.

## For AI Agents

### Working In This Directory
- pnpm만 쓴다 (`pnpm install`, `pnpm add`). npm/yarn lock 파일을 만들지 않는다.
- 코드 주석·UI 문구·커밋 메시지는 한국어. 사용자 문구는 쉬운 존댓말("~해요")로 쓴다.
- TypeScript strict, `any` 금지. 데이터 구조는 `app/types/`에 먼저 정한다.
- 환경 변수는 모두 공개용(`NUXT_PUBLIC_*`)이다. Supabase **service_role(secret) 키는 절대 코드·워크플로에 넣지 않는다**.
- `capacitor.config.ts`의 `appId`는 스토어 등록 후 바꿀 수 없다.

### Testing Requirements
- 테스트 프레임워크는 없다. 변경 후 `pnpm typecheck`와 `pnpm generate`가 통과해야 한다 (푸시 전 필수).
- UI 변경은 `pnpm dev`(http://localhost:3000)에서 모바일(≤1080px)·PC 폭 모두 확인한다.

### Common Patterns
- 화면(pages/components) → Pinia 스토어 → 동기화 플러그인 → Supabase. 화면은 서버를 직접 부르지 않는다.
- 스토어는 localStorage에 먼저 저장되고, 동기화는 "baseline과 비교해 바뀐 행만 upsert / 사라진 행만 delete" 방식.
- Nuxt 자동 import: `app/utils/`, `app/composables/`, `app/stores/`의 export와 `app/components/`는 import 없이 쓴다. `app/constants/`·`app/types/`는 명시적으로 import 한다.

## Dependencies

### External
- Nuxt 4 / Vue 3 — SPA, 파일 기반 라우팅
- Pinia 4 + pinia-plugin-persistedstate — 상태·로컬 저장
- @supabase/supabase-js 2 — DB·Realtime
- Capacitor 8 (`core`, `android`, `ios`, `app`, `filesystem`, `share`) — 네이티브 앱
- vue-draggable-plus — 배분 화면 드래그
- html-to-image — 공유 이미지 생성
- sass — SCSS
- 네이버 지도 JS API v3 (선택, 런타임 스크립트 로드)

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
