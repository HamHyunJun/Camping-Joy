# CampPack

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

## 개발 단계

1. 프로젝트 구조와 타입 정의 ← 현재
2. 캠핑 정보 및 멤버 등록
3. 장비 등록
4. 장비 배분 데이터 구조
5. 배분 결과 UI
6. 장비 배분 알고리즘
7. UX 개선 및 예외 처리
