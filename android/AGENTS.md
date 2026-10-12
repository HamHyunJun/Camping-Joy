# android

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
Capacitor가 만든 안드로이드 네이티브 프로젝트(Gradle). 웹 빌드(`.output/public`)를 앱 안에 넣어 오프라인에서도 열리게 한다. 커스텀 네이티브 코드는 없다.

## Key Files
| File | Description |
|------|-------------|
| `app/build.gradle` | `namespace`/`applicationId` `com.campingjoy.app`, `versionCode`/`versionName` |
| `app/src/main/AndroidManifest.xml` | 액티비티·권한 |
| `app/src/main/java/com/campingjoy/app/MainActivity.java` | 빈 `BridgeActivity` |
| `app/src/main/res/` | 아이콘·스플래시(`@capacitor/assets`로 생성), `values/` 문자열·테마 |
| `variables.gradle` | SDK 버전(min 24, compile/target 36), AndroidX 버전 |
| `capacitor.settings.gradle`, `app/capacitor.build.gradle` | Capacitor CLI가 관리 (직접 수정 금지) |

## For AI Agents

### Working In This Directory
- 웹 코드를 바꾼 뒤에는 `pnpm android:sync`(= `nuxt generate && cap sync android`)로 반영한다. `app/src/main/assets/public`, `capacitor.config.json`, `capacitor.plugins.json`, `res/xml/config.xml`은 생성물(gitignore)이다.
- Capacitor 플러그인을 추가하면 `pnpm add @capacitor/<name>` 후 sync. Gradle 파일을 손으로 편집하지 않는다.
- 아이콘·스플래시는 루트 `assets/` 원본을 바꾸고 `pnpm dlx @capacitor/assets generate --android`.
- `androidTest`/`test`의 `com.getcapacitor.myapp` 예제 테스트는 템플릿 그대로다.

### Testing Requirements
- `pnpm android:sync && cd android && ./gradlew assembleDebug`, 또는 `pnpm android:open`으로 Android Studio 실행. CI(`.github/workflows/android.yml`)가 PR마다 디버그 APK를 만든다.

## Dependencies

### Internal
- `../capacitor.config.ts`, `../.output/public`(빌드 결과), `../node_modules/@capacitor/*`

### External
- Capacitor Android 8, Gradle, JDK 21

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
