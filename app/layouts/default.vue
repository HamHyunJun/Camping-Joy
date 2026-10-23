<template>
  <div class="layout">
    <!-- 헤더의 backdrop-filter가 fixed 기준이 되지 않도록 밖에 둔다 -->
    <div v-if="menuOpen" class="menu-backdrop" @click="menuOpen = false" />
    <div class="top">
      <header class="header">
        <!-- 캠핑 만드는 중에는 로고 앞에 모임 홈으로 가는 뒤로가기 -->
        <NuxtLink v-if="campId" :to="group.path()" class="back" aria-label="캠핑 목록으로"><span class="back-icon" aria-hidden="true" /></NuxtLink>
        <NuxtLink to="/" class="logo">
          <span class="logo-mark"><img :src="tentIcon" alt="" width="18" height="18" /></span>
          Camping&amp;Joy
        </NuxtLink>
        <div class="menu-wrap">
          <button
            class="menu-button"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="menuOpen"
            aria-label="메뉴"
            @click="menuOpen = !menuOpen"
          >
            <img :src="menuIcon" alt="" width="24" height="24" />
          </button>
          <Transition name="menu">
            <nav v-if="menuOpen" class="menu" aria-label="내 메뉴">
              <NuxtLink
                v-for="item in menuItems"
                :key="item.to"
                :to="item.to"
                class="menu-item"
                :class="{ active: route.path === item.to }"
              >
                {{ item.label }}
              </NuxtLink>
              <button type="button" class="menu-item logout" @click="logout">로그아웃</button>
            </nav>
          </Transition>
        </div>
      </header>

      <!-- 모임 안: 전체 캠핑 / 멤버·장비 등록. 캠핑을 만드는 중에는 아래 단계 표시줄이 대신한다. -->
      <nav v-if="tabs.length" class="tabs" aria-label="모임 메뉴">
        <NuxtLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="tab" :class="{ active: route.path === tab.to }">
          {{ tab.label }}
        </NuxtLink>
      </nav>

      <StepNav v-if="campId" :camp-id="campId" />
    </div>
    <main class="content" :class="{ wide: route.meta.wide }">
      <slot />
    </main>
    <!-- 갤럭시 하단 내비게이션 바·아이폰 홈 바 뒤로 목록이 비쳐 보이지 않게 배경을 깐다 -->
    <div class="bottom-safe" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import menuIcon from '~/assets/icons/menu.svg'
import tentIcon from '~/assets/icons/tent.svg'

const route = useRoute()
const auth = useAuthStore()
const group = useGroupStore()

const menuOpen = ref(false)
const campId = computed(() => {
  const id = route.params.campId
  return typeof id === 'string' ? id : undefined
})

const inGroup = computed(() => typeof route.params.groupId === 'string')

// 햄버거 메뉴. 모임 관리는 모임 안에서 관리자·운영진에게만 보인다.
const menuItems = computed(() => [
  { to: '/profile', label: '내 정보' },
  ...(inGroup.value && group.isStaff ? [{ to: group.path('/manage'), label: '모임 관리' }] : []),
])

const tabs = computed(() =>
  inGroup.value && !campId.value
    ? [
        { to: group.path(), label: '전체 캠핑' },
        { to: group.path('/gear'), label: '멤버·장비 등록' },
      ]
    : [],
)

const logout = async (): Promise<void> => {
  await auth.signOut()
  await navigateTo('/login')
}

const closeOnEsc = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') menuOpen.value = false
}

onBeforeUnmount(() => window.removeEventListener('keydown', closeOnEsc))

watch(() => route.fullPath, () => (menuOpen.value = false))
// 메뉴가 열려 있는 동안만 Esc를 받는다.
watch(menuOpen, (open) => (open ? window.addEventListener('keydown', closeOnEsc) : window.removeEventListener('keydown', closeOnEsc)))
</script>

<style scoped lang="scss">
.layout {
  min-height: 100dvh;
  padding-bottom: var(--safe-bottom);
}

.top {
  position: sticky;
  top: 0;
  z-index: 20;
  padding-top: var(--safe-top);
  background: rgb(255 255 255 / 92%);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
}

.header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1120px;
  height: var(--header-height);
  margin: 0 auto;
  padding: 0 var(--space-2) 0 var(--space-4);
}

.logo {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-2);
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -0.02em;
  color: var(--color-primary);
  text-decoration: none;
}

.logo-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--color-primary);

  img {
    filter: brightness(0) invert(1);
  }
}

.menu-wrap {
  position: relative;
}

.menu-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    background: var(--color-surface-muted);
  }

  &:active {
    transform: scale(0.92);
  }
}

.tabs {
  display: flex;
  gap: var(--space-1);
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 var(--space-3);
}

.tab {
  padding: var(--space-2) var(--space-3);
  border-bottom: 2px solid transparent;
  color: var(--color-text-muted);
  font-size: 14px;
  text-decoration: none;
  transition:
    color 160ms ease,
    border-color 160ms ease;

  &:hover {
    color: var(--color-text);
  }

  &.active {
    border-bottom-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: 600;
  }
}

.back {
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-left: calc(var(--space-2) * -1);
  border-radius: 10px;
  color: var(--color-text);
  text-decoration: none;
  transition:
    background-color 160ms ease,
    transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    background: var(--color-surface-muted);
  }

  &:active {
    transform: scale(0.92);
  }
}

.bottom-safe {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 25;
  height: var(--safe-bottom);
  background: var(--color-bg);
  pointer-events: none;
}

.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 15;
  background: rgb(0 0 0 / 20%);
}

.menu {
  position: absolute;
  top: calc(100% + var(--space-1));
  right: 0;
  z-index: 30;
  transform-origin: top right;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  padding: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
}

.menu-item {
  padding: var(--space-3);
  border-radius: 8px;
  text-decoration: none;

  &.active {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: 600;
  }
}

.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 140ms ease,
    transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

@media (prefers-reduced-motion: reduce) {
  .menu-enter-active,
  .menu-leave-active {
    transition: none;
  }
}

.logout {
  border: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.content {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-5) var(--space-4) var(--space-8);

  &.wide {
    max-width: 1120px;
  }
}
</style>
