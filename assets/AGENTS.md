# assets

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
네이티브 앱 아이콘·스플래시 **원본** 이미지. `@capacitor/assets`가 이 파일들로 `android/app/src/main/res/`와 iOS `Assets.xcassets`를 생성한다. 웹 앱이 쓰는 스타일·아이콘은 `app/assets/`에 있다.

## Key Files
| File | Description |
|------|-------------|
| `icon-only.png` | 기본 앱 아이콘 |
| `icon-foreground.png`, `icon-background.png` | 안드로이드 adaptive 아이콘 레이어 |
| `splash.png`, `splash-dark.png` | 스플래시 (라이트/다크) |

## For AI Agents

### Working In This Directory
- 이미지를 바꾼 뒤 `pnpm dlx @capacitor/assets generate --android` / `--ios`로 네이티브 리소스를 다시 만든다. 생성된 `res/`·`Assets.xcassets`를 손으로 고치지 않는다.
- 파일 이름은 `@capacitor/assets` 규칙이므로 바꾸지 않는다.

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
