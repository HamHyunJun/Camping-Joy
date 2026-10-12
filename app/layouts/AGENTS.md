# layouts

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
앱 전체를 감싸는 기본 레이아웃.

## Key Files
| File | Description |
|------|-------------|
| `default.vue` | 고정 헤더(로고·메뉴: 전체 캠핑 / 멤버·장비 등록), 캠핑 화면일 때 `StepNav`, 본문(`.content`, `route.meta.wide`면 넓게), 하단 safe area 배경(`.bottom-safe`) |

## For AI Agents

### Working In This Directory
- 상·하단 여백은 `--safe-top`/`--safe-bottom`(`assets/scss/_tokens.scss`)으로만 처리한다. 안드로이드는 Capacitor SystemBars가 `--safe-area-inset-*`를 넣고, iOS·브라우저는 `env()`를 쓴다. 헤더·하단 내비게이션과 겹치지 않는지 확인한다.
- 메뉴 항목을 추가하면 `menuItems` 배열에 넣는다. 라우트 변경 시 메뉴는 자동으로 닫힌다.

### Testing Requirements
- `pnpm typecheck`. safe area 관련 변경은 안드로이드/iOS 앱에서 확인.

### Common Patterns
- `--header-height`(60px), `--content-max`(760px) 토큰을 레이아웃 크기에 쓴다.

## Dependencies

### Internal
- `components/StepNav.vue`, `assets/icons/`, `assets/scss/_tokens.scss`, `types/page-meta.d.ts`(`wide`)

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
