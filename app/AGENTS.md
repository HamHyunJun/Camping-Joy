# app

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
Nuxt 4의 `srcDir`. 화면, 상태(스토어), 서버 동기화, 타입, 순수 함수, 스타일이 모두 여기에 있다. `~/`는 이 디렉터리를 가리킨다.

## Key Files
| File | Description |
|------|-------------|
| `app.vue` | `<NuxtLayout><NuxtPage /></NuxtLayout>` 뿐인 루트 컴포넌트 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `pages/` | 파일 기반 라우트: 홈, 멤버·장비 등록, 캠핑 5단계 (see `pages/AGENTS.md`) |
| `components/` | 여러 화면에서 같이 쓰는 컴포넌트 (see `components/AGENTS.md`) |
| `layouts/` | 헤더·메뉴·단계 표시·safe area 레이아웃 (see `layouts/AGENTS.md`) |
| `stores/` | Pinia 스토어 `camp`, `gear` (see `stores/AGENTS.md`) |
| `plugins/` | Supabase 동기화, 안드로이드 뒤로가기 (see `plugins/AGENTS.md`) |
| `composables/` | Supabase 클라이언트, 네이버 지도 (see `composables/AGENTS.md`) |
| `middleware/` | 캠핑 선택·단계 접근 제한 전역 미들웨어 (see `middleware/AGENTS.md`) |
| `types/` | 도메인·DB 타입 (see `types/AGENTS.md`) |
| `utils/` | 자동 import 되는 순수 함수 (see `utils/AGENTS.md`) |
| `constants/` | 장비 카테고리·프리셋·크기, 캠핑 단계 (see `constants/AGENTS.md`) |
| `assets/` | SCSS 토큰·공통 스타일, SVG 아이콘 (see `assets/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- `.vue` 파일 블록 순서: `<template>` → `<script setup lang="ts">` → `<style scoped lang="scss">`.
- 데이터 흐름은 한 방향: 화면은 스토어를 읽고 액션을 부른다. Supabase 호출은 `plugins/*Sync.client.ts`에만 둔다.
- 새 데이터 필드는 `types/camp.ts` → (서버에 저장하면) `types/database.ts` + `supabase/migrations/` + 동기화 플러그인의 `toRow`/`fromRow` 순서로 반영한다.
- 앱은 SPA라 `window`/`document`를 바로 써도 되지만, 네이티브 전용 API는 `Capacitor.isNativePlatform()`으로 분기한다.

### Testing Requirements
- `pnpm typecheck`, `pnpm generate` 통과.

### Common Patterns
- 자동 import: `utils/`, `composables/`, `stores/`, `components/`. `constants/`와 `types/`는 `~/constants/...`, `~/types/...`로 import.
- SVG 아이콘은 `import icon from '~/assets/icons/x.svg'` 후 `<img :src>`로 쓴다.

## Dependencies

### Internal
- `../supabase/migrations/` — DB 스키마 (`types/database.ts`와 맞춰야 함)
- `../nuxt.config.ts` — runtimeConfig·SCSS 설정

### External
- Nuxt 4, Vue 3, Pinia, @supabase/supabase-js, @capacitor/*, vue-draggable-plus, html-to-image

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
