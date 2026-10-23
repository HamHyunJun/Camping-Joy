# components

**Parent context:** `../AGENTS.md`
**Generated:** 2026-10-12 · **Updated:** 2026-10-12

## Purpose
여러 화면에서 같이 쓰거나 화면 하나에 넣기엔 큰 UI 조각. Nuxt가 자동 등록하므로 import 없이 `<CampListItem />`처럼 쓴다.

## Key Files
| File | Description |
|------|-------------|
| `CampListItem.vue` | 캠핑 카드 (날짜·D-day·진행 상태·삭제). 홈·지난 캠핑에서 사용. props: `camp` |
| `PersonGearCard.vue` | 사람별 장비 카드: 접기/펼치기, 프리셋·직접 입력으로 장비 추가, 크기·모델명·수량 변경, 이름 변경·삭제. props: `person`, `initiallyOpen?` |
| `ConfirmModal.vue` | 확인·취소 모달(네이티브 `<dialog>`). 내용은 슬롯, `title`·`confirmLabel`·`cancelLabel`·`danger`·`confirmDisabled`·`alert`(false면 role=dialog, 입력 폼을 담을 때) props. 직접 쓰지 말고 `useConfirm().ask({ title, message, confirmLabel, danger })`로 띄운다(브라우저 기본 `confirm()` 금지). 화면에는 `app.vue`의 모달 하나만 떠 있다 |
| `SelectMenu.vue` | 기본 `<select>` 대체 드롭다운. `v-model`(string), `options: SelectMenuOption[]`, `size: 'sm'|'md'`. 공간이 부족하면 위로 펼침. `SelectMenuOption` 타입을 export |
| `StepNav.vue` | 캠핑 5단계 표시·이동. 갈 수 없는 단계는 비활성. 완료 표시(✓)는 `isStepComplete` 기준이지만 일정은 하나라도 적었을 때만, 결과는 표시하지 않는다. props: `campId` |
| `ShareSheet.vue` | 결과 공유 시트: 이미지 카드(`html-to-image`, pixelRatio 2) / 텍스트(`buildShareText`). 네이티브는 `@capacitor/filesystem`+`@capacitor/share`, 웹은 Web Share 또는 다운로드·클립보드. props: `camp`, emits: `close` |
| `PlaceMap.vue` | 캠핑장 지도(네이버 지도 키가 있을 때) 또는 "네이버 지도에서 보기" 버튼. props: `place: CampPlace` |

## For AI Agents

### Working In This Directory
- 컴포넌트는 여러 화면에서 같이 쓸 때만 새로 만든다. 한 화면 전용 UI는 페이지 안에 둔다.
- 블록 순서 `<template>` → `<script setup lang="ts">` → `<style scoped lang="scss">`, props/emits는 타입 기반 `defineProps<...>()`/`defineEmits<...>()`.
- 상태 변경은 스토어 액션으로만 한다 (예: `PersonGearCard`는 `gear.addEquipment`, `setEquipmentSize` 등).
- 네이티브 분기(`Capacitor.isNativePlatform()`)가 필요한 기능은 `ShareSheet.vue`처럼 웹·앱 경로를 모두 구현한다. 웹뷰는 다운로드 링크·Web Share가 안 된다.
- 공유 이미지 파일 이름은 영문으로 짓는다(한글 파일명을 깨뜨리는 브라우저가 있음).

### Testing Requirements
- `pnpm typecheck`. 공유·지도는 웹과 앱(가능하면 `pnpm android:sync`) 양쪽에서 확인.

### Common Patterns
- 바깥 클릭 닫기: `document.addEventListener('pointerdown', ...)`를 `onMounted`/`onBeforeUnmount`에서 등록·해제.
- 색·간격은 `var(--color-*)`, `var(--space-*)` 토큰, 반응형은 `@include mobile` / `@include pc`.

## Dependencies

### Internal
- `stores/`, `utils/` (`campProgress`, `formatDday`, `groupByCategory`, `sizeGuideOf`, `buildShareText` 등), `composables/useNaverMaps.ts`, `constants/equipment.ts`, `assets/icons/`

### External
- `html-to-image`, `@capacitor/core`, `@capacitor/filesystem`, `@capacitor/share`

## Manual Notes

Notes under this heading are written by humans and preserved on regeneration.
