# Camping&Joy

캠핑을 함께 가는 멤버와 각자 보유한 장비를 등록하고, 필요한 장비를 멤버들에게 배분해 한눈에 확인하는 웹 서비스.

## 기술 스택

Nuxt 4 (SPA, `ssr: false`) · Vue 3 · TypeScript · Pinia · SCSS

## 시작하기

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm typecheck
pnpm generate       # 정적 SPA 빌드 (.output/public)
```

## 구조

```
app/
  pages/             index, camps/[campId]/{info,members,equipments,distribute,result}
  components/        StepNav 등 재사용 컴포넌트
  stores/camp.ts     캠핑·멤버·장비·배분 상태 (localStorage 저장)
  types/camp.ts      도메인 타입
  utils/             배분 전략·점검 등 순수 함수
  constants/         장비 카테고리, 단계 정의
```

## 화면 흐름

1. ☰ 메뉴 → 멤버·장비 등록: 사람과 각자 보유 장비를 한 번만 등록
2. 내 캠핑 → 새 캠핑: 캠핑 정보 → 멤버 → 배분(공통으로 챙길 장비를 고르면 주인이 챙김) → 결과(캠핑 정보, 멤버, 배분표, 준비 체크, 남은 장비)
