# .github

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
GitHub Actions 워크플로. `main` push, 모든 PR, 수동 실행 시 네이티브 앱이 빌드되는지 확인한다. 웹 배포는 여기가 아니라 Vercel Git 연동이 담당한다.

## Key Files
| File | Description |
|------|-------------|
| `workflows/android.yml` | ubuntu, Node 22 + pnpm + JDK 21 → `pnpm android:sync` → `./gradlew assembleDebug` → 아티팩트 `camping-joy-debug-apk` 업로드 |
| `workflows/ios.yml` | macOS, Node 22 + pnpm → `pnpm ios:sync` → `xcodebuild` 시뮬레이터 빌드(`CODE_SIGNING_ALLOWED=NO`) |

## For AI Agents

### Working In This Directory
- 두 워크플로 모두 `pnpm install --frozen-lockfile`을 쓰므로 `package.json`을 바꾸면 `pnpm-lock.yaml`도 함께 커밋해야 한다.
- 워크플로의 `NUXT_PUBLIC_SUPABASE_URL`/`NUXT_PUBLIC_SUPABASE_KEY`는 앱에 들어가는 공개용(publishable) 값이다. 비밀 키가 필요해지면 하드코딩하지 말고 GitHub Secrets를 쓴다.
- 두 워크플로의 설치·빌드 단계는 같은 구조로 유지한다.

### Testing Requirements
- PR을 올려 두 워크플로가 통과하는지 확인 (로컬 대체: `pnpm android:sync`, `pnpm ios:sync`).

## Dependencies

### Internal
- `../package.json` 스크립트, `../android/`, `../ios/`

### External
- `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`, `actions/setup-java@v4`, `actions/upload-artifact@v4`

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
