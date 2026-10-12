# assets

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
Vite가 번들하는 스타일과 아이콘. (앱 아이콘·스플래시 원본은 루트 `assets/`로, 여기와 다르다.)

## Key Files
| File | Description |
|------|-------------|
| `scss/_tokens.scss` | `:root` CSS 변수: 색(`--color-*`), 그림자, 반경, 간격(`--space-1`~`8`), `--header-height`, `--safe-top`/`--safe-bottom`, `--content-max` |
| `scss/_breakpoints.scss` | `$mobile-max: 1080px`, `@mixin mobile` / `@mixin pc`. `nuxt.config.ts`가 모든 SCSS에 자동 `@use` |
| `scss/main.scss` | 전역 스타일과 공통 클래스: `.page-head`, `.page-title`, `.page-desc`, `.section-title`, `.card`, `.field`, `.field-error`, `.input`, `.btn`(변형 포함), `.page-actions`, `.chip`, `.avatar`, `.empty`, `.notice` |
| `icons/*.svg` | `menu`, `search`, `tent`, `trash` 아이콘 |

## For AI Agents

### Working In This Directory
- 색·간격은 하드코딩하지 말고 토큰 변수를 쓴다. 새 색이 필요하면 `_tokens.scss`에 추가한다.
- 입력창 글자 크기는 16px 이상 유지(모바일 웹뷰 포커스 확대 방지).
- 공통 클래스로 해결되면 컴포넌트 scoped 스타일을 새로 만들지 않는다.

### Testing Requirements
- 모바일(≤1080px)·PC 폭에서 화면 확인.

## Dependencies

### Internal
- `../../nuxt.config.ts`(`css`, `additionalData`)

### External
- `sass`

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
