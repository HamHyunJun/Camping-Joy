# middleware

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
라우트 미들웨어. 현재는 전역 미들웨어 하나.

## Key Files
| File | Description |
|------|-------------|
| `camp.global.ts` | `campId` 파라미터가 있으면 `store.selectCamp(campId)`. 없는 캠핑이면 `/`로, 앞 단계가 미완료면 `lastVisitableStep()`으로 리다이렉트 |

## For AI Agents

### Working In This Directory
- `.global.ts`라 모든 라우트에서 실행된다. `campId`가 없는 라우트는 바로 return 해야 한다.
- 단계 판정 로직은 여기에 쓰지 말고 `utils/campSteps.ts`에 둔다.
- 앱 시작 직후 서버 동기화 전에는 로컬 캠핑만 있으므로, 다른 기기에서 만든 캠핑 링크로 바로 들어오면 `/`로 갈 수 있다.

### Testing Requirements
- 주소창에 없는 `campId`, 미완료 캠핑의 `/result`를 직접 입력해 리다이렉트 확인. `pnpm typecheck`.

## Dependencies

### Internal
- `stores/camp.ts`, `constants/steps.ts`, `utils/campSteps.ts`

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
