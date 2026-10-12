# ios

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
Capacitor가 만든 iOS 네이티브 프로젝트(Xcode + Swift Package Manager). 웹 빌드를 앱 번들에 넣는다. 커스텀 네이티브 코드는 없다.

## Key Files
| File | Description |
|------|-------------|
| `App/App.xcodeproj/` | Xcode 프로젝트 (scheme `App`) |
| `App/App/AppDelegate.swift`, `SceneDelegate.swift` | Capacitor 기본 앱 진입점 |
| `App/App/Info.plist` | 앱 설정 |
| `App/App/Base.lproj/` | `LaunchScreen.storyboard`, `Main.storyboard` |
| `App/CapApp-SPM/Package.swift` | Capacitor 플러그인 SPM 의존성 — **Capacitor CLI가 관리, 수정 금지** |
| `debug.xcconfig` | 디버그 빌드 설정 |

## For AI Agents

### Working In This Directory
- 웹 코드를 바꾼 뒤 `pnpm ios:sync`(= `nuxt generate && cap sync ios`). `App/App/public`, `App/App/capacitor.config.json`, `App/App/config.xml`, `capacitor-cordova-ios-plugins/`는 생성물(gitignore)이다.
- `Package.swift`의 경로는 pnpm `node_modules/.pnpm/...`을 가리키므로 의존성 버전이 바뀌면 sync로 다시 만든다.
- 서명(Team)은 각자 Xcode에서 설정하며 커밋하지 않는다.
- 아이콘·스플래시는 루트 `assets/` 원본을 바꾸고 `pnpm dlx @capacitor/assets generate --ios`.

### Testing Requirements
- Mac에서 `pnpm ios:sync && pnpm ios:open` 후 시뮬레이터/기기 실행. CI(`.github/workflows/ios.yml`)는 서명 없이 시뮬레이터 빌드만 확인한다.

## Dependencies

### Internal
- `../capacitor.config.ts`, `../.output/public`, `../node_modules/@capacitor/*`

### External
- Capacitor iOS 8 (`capacitor-swift-pm`), Xcode, iOS 15+

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
