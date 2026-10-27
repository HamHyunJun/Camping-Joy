<template>
  <nav class="tabbar" aria-label="하단 메뉴">
    <NuxtLink :to="group.path()" class="tab-item" :class="{ active: route.path === group.path() }">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 21 14 3M20.5 21 10 3M15.5 21 12 15l-3.5 6M2 21h20" /></svg>
      <span>전체 캠핑</span>
    </NuxtLink>
    <NuxtLink :to="group.path('/gear')" class="tab-item" :class="{ active: route.path === group.path('/gear') }">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5M8 10h8" />
      </svg>
      <span>장비 등록</span>
    </NuxtLink>
    <button type="button" class="tab-item" aria-haspopup="dialog" @click="openSheet">
      <span class="icon-wrap">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01" /></svg>
        <span v-if="hasPending" class="dot" aria-hidden="true" />
      </span>
      <span>더보기</span>
    </button>
  </nav>

  <!-- 더보기: 모바일 바텀시트. 배경 비활성·포커스 가두기·Esc는 네이티브 dialog가 맡는다. -->
  <dialog
    ref="sheet"
    class="sheet"
    :class="{ closing }"
    :aria-labelledby="titleId"
    @cancel.prevent="closeSheet"
    @close="closing = false"
    @click.self="closeSheet"
    @animationend.self="onAnimationEnd"
  >
    <div class="sheet-panel">
      <div class="sheet-head">
        <h2 :id="titleId" class="sheet-title">더보기</h2>
        <button class="icon-close" type="button" autofocus aria-label="닫기" @click="closeSheet" />
      </div>
      <ul class="more-list">
        <li><NuxtLink to="/profile" class="more-item" @click="dismiss">내 정보</NuxtLink></li>
        <li v-if="manageTo">
          <NuxtLink :to="manageTo" class="more-item" @click="dismiss">
            모임 관리
            <span v-if="hasPending" class="dot" aria-hidden="true" />
          </NuxtLink>
        </li>
        <li><button class="more-item logout" type="button" @click="logout">로그아웃</button></li>
      </ul>
    </div>
  </dialog>
</template>

<script setup lang="ts">
defineProps<{ manageTo?: string; hasPending: boolean }>()
const emit = defineEmits<{ logout: [] }>()

const route = useRoute()
const group = useGroupStore()

const sheet = ref<HTMLDialogElement>()
const titleId = useId()
const closing = ref(false)

const openSheet = (): void => sheet.value?.showModal()

// 닫을 때는 아래로 내려간 뒤 dialog를 닫는다. 애니메이션을 줄인 환경에서는 바로 닫는다.
const closeSheet = (): void => {
  if (!sheet.value?.open || closing.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) sheet.value.close()
  else closing.value = true
}

const onAnimationEnd = (): void => {
  if (closing.value) sheet.value?.close()
}

/** 다른 화면으로 가는 항목은 시트를 바로 닫는다(화면이 옆으로 밀리는 동안 시트가 남지 않게). */
const dismiss = (): void => sheet.value?.close()

const logout = (): void => {
  dismiss()
  emit('logout')
}
</script>

<style scoped lang="scss">
// 화면 이동 효과(View Transition) 중에도 제자리에 있게 따로 분리한다. 반투명·블러는 분리된 스냅샷에서 배경이 빠져 깜빡여 보이므로 불투명하게 둔다.
.tabbar {
  view-transition-name: tabbar;
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 26;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding-bottom: var(--safe-bottom);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);

  @include pc {
    display: none;
  }
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: calc(var(--tabbar-height) - 1px);
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: color 200ms ease;

  &.active {
    color: var(--color-primary);
  }

  // 글자까지 같이 줄이면 누를 때마다 글자 간격이 달라져 보이므로 아이콘만 눌린다.
  &:active svg {
    transform: scale(0.88);
  }

  svg {
    width: 24px;
    height: 24px;
    transition: transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);
    fill: none;
    stroke: currentcolor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.icon-wrap {
  position: relative;
  display: grid;
}

.dot {
  position: absolute;
  top: -1px;
  right: -3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-danger);
}

.sheet {
  width: 100%;
  max-width: 560px;
  max-height: 80dvh;
  margin: auto auto 0;
  padding: 0;
  border: 0;
  border-radius: var(--radius) var(--radius) 0 0;
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-md);

  &[open] {
    animation: sheet-in 280ms cubic-bezier(0.32, 0.72, 0, 1);
  }

  &::backdrop {
    background: rgb(0 0 0 / 35%);
  }

  &[open]::backdrop {
    animation: backdrop-in 280ms ease;
  }

  &.closing {
    animation: sheet-out 220ms cubic-bezier(0.32, 0.72, 0, 1) forwards;

    &::backdrop {
      animation: backdrop-out 220ms ease forwards;
    }
  }
}

.sheet-panel {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-4) calc(var(--space-4) + var(--safe-bottom));
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.sheet-title {
  margin: 0;
  font-size: 17px;
}

.more-list {
  margin: 0;
  padding: 0;
  list-style: none;

  li + li {
    border-top: 1px solid var(--color-border);
  }
}

.more-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  width: 100%;
  min-height: 52px;
  padding: 0 var(--space-1);
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;

  .dot {
    position: static;
    align-self: flex-start;
    margin-top: 14px;
  }

  &.logout {
    color: var(--color-danger);
  }
}

@keyframes sheet-in {
  from {
    transform: translateY(100%);
  }
}

@keyframes sheet-out {
  to {
    transform: translateY(100%);
  }
}

@keyframes backdrop-in {
  from {
    opacity: 0;
  }
}

@keyframes backdrop-out {
  to {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sheet[open],
  .sheet[open]::backdrop {
    animation: none;
  }
}
</style>
