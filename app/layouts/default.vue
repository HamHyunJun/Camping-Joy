<template>
  <div class="layout" :class="{ 'has-tabbar': showTabbar }">
    <!-- 헤더의 backdrop-filter가 fixed 기준이 되지 않도록 밖에 둔다 -->
    <div v-if="menuOpen" class="menu-backdrop" @click="menuOpen = false" />
    <div class="top">
      <header class="header">
        <!-- 캠핑 만드는 중에는 로고 앞에 모임 홈으로 가는 뒤로가기. 모바일은 모든 상세 화면에서 뒤로가기와 제목을 보여 준다. -->
        <NuxtLink v-if="backTo" :to="backTo" class="back" :class="{ 'mobile-only': !campId }" :aria-label="campId ? '캠핑 목록으로' : '이전 화면으로'">
          <span class="back-icon" aria-hidden="true" />
        </NuxtLink>
        <span v-if="backTo" class="bar-title">{{ barTitle }}</span>
        <NuxtLink :to="logoTo" class="logo" :class="{ 'hide-mobile': backTo }">
          <span class="logo-mark"><img :src="tentIcon" alt="" width="18" height="18" /></span>
          Camping&amp;Joy
        </NuxtLink>
        <div class="menu-wrap" :class="{ 'hide-mobile': depth > 0 }">
          <button
            class="menu-button"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="menuOpen"
            aria-label="메뉴"
            @click="menuOpen = !menuOpen"
          >
            <img :src="menuIcon" alt="" width="24" height="24" />
            <span v-if="hasPending" class="dot" aria-hidden="true" />
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
                <span v-if="item.badge" class="dot" aria-hidden="true" />
              </NuxtLink>
              <button type="button" class="menu-item logout" @click="logout">로그아웃</button>
            </nav>
          </Transition>
        </div>
      </header>

      <!-- 모임 안: 전체 캠핑 / 멤버·장비 등록. 캠핑을 만드는 중에는 아래 단계 표시줄이 대신한다. -->
      <nav v-if="tabs.length" ref="tabsEl" class="tabs" aria-label="모임 메뉴">
        <NuxtLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="tab" :class="{ active: route.path === tab.to }">
          {{ tab.label }}
        </NuxtLink>
        <!-- 활성 탭 아래 막대. 탭을 옮기면 미끄러지듯 따라간다. -->
        <span
          v-if="indicator"
          class="tab-indicator"
          :class="{ animate }"
          :style="{ width: `${indicator.width}px`, transform: `translateX(${indicator.x}px)` }"
          aria-hidden="true"
        />
      </nav>

      <StepNav v-if="campId" :camp-id="campId" />
    </div>
    <main class="content" :class="{ wide: route.meta.wide }">
      <slot />
    </main>
    <!-- 갤럭시 하단 내비게이션 바·아이폰 홈 바 뒤로 목록이 비쳐 보이지 않게 배경을 깐다 -->
    <div class="bottom-safe" aria-hidden="true" />
    <!-- 모바일의 모임 홈·멤버·장비 등록에서만 보이는 하단 탭 -->
    <BottomTabs v-if="showTabbar" :manage-to="canManage ? `/g/${manageGroupId}/manage` : undefined" :has-pending="hasPending" @logout="logout" />
  </div>
</template>

<script setup lang="ts">
import menuIcon from '~/assets/icons/menu.svg'
import tentIcon from '~/assets/icons/tent.svg'
import navDepth from '~/utils/navDepth'

const route = useRoute()
const auth = useAuthStore()
const group = useGroupStore()
const camps = useCampStore()

const menuOpen = ref(false)
const tabsEl = ref<HTMLElement>()
const indicator = ref<{ x: number; width: number }>()
const animate = ref(false)
const campId = computed(() => {
  const id = route.params.campId
  return typeof id === 'string' ? id : undefined
})

const inGroup = computed(() => typeof route.params.groupId === 'string')

const depth = computed(() => navDepth.depthOf(route.path))
const showTabbar = computed(() => inGroup.value && depth.value === 1)

// 내 정보에서는 로고로 방금 보던 모임에 돌아간다. 모임을 모르면 모임 목록으로 간다.
const logoTo = computed(() => (route.path === '/profile' && group.lastGroupId ? `/g/${group.lastGroupId}` : '/'))

// 모임 관리를 보여 줄 모임. 모임 안이거나, 모임에서 내 정보로 건너온 경우 방금 보던 모임이다.
const manageGroupId = computed(() => (inGroup.value ? group.currentGroupId : route.path === '/profile' ? group.lastGroupId : undefined))
const canManage = computed(() => {
  const role = manageGroupId.value ? group.roleIn(manageGroupId.value) : undefined
  return role === 'owner' || role === 'admin'
})

// 상세 화면(깊이 2)의 뒤로가기 목적지와 제목. 내 정보는 방금 보던 모임으로, 나머지는 모임 홈으로 돌아간다.
const backTo = computed(() => (depth.value === 2 ? (route.path === '/profile' ? logoTo.value : group.path()) : undefined))
const barTitle = computed(() => {
  if (route.path === '/profile') return '내 정보'
  if (route.path.endsWith('/manage')) return '모임 관리'
  if (route.path.endsWith('/camps/past')) return '지난 캠핑'
  return camps.currentCamp?.name || '캠핑 계획'
})

// 가입 신청은 관리자·운영진에게만 보인다.
const hasPending = computed(() => canManage.value && group.pending.length > 0)

// 햄버거 메뉴. 모임 관리는 관리자·운영진에게만 보인다.
const menuItems = computed(() => [
  { to: '/profile', label: '내 정보', badge: false },
  ...(canManage.value ? [{ to: `/g/${manageGroupId.value}/manage`, label: '모임 관리', badge: hasPending.value }] : []),
])

const tabs = computed(() =>
  inGroup.value && !campId.value
    ? [
        { to: group.path(), label: '전체 캠핑' },
        { to: group.path('/gear'), label: '멤버·장비 등록' },
      ]
    : [],
)

// 활성 탭의 위치를 재서 막대를 옮긴다. 처음 나타날 때는 제자리에 두고, 그 뒤부터 움직인다.
const moveIndicator = async (): Promise<void> => {
  await nextTick()
  const active = tabsEl.value?.querySelector<HTMLElement>('.tab.active')
  if (!active) {
    indicator.value = undefined
    animate.value = false
    return
  }
  const first = !indicator.value
  indicator.value = { x: active.offsetLeft, width: active.offsetWidth }
  if (first) requestAnimationFrame(() => (animate.value = true))
}

const logout = async (): Promise<void> => {
  await auth.signOut()
  await navigateTo('/login')
}

const closeOnEsc = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') menuOpen.value = false
}

onMounted(() => {
  moveIndicator()
  window.addEventListener('resize', moveIndicator)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', closeOnEsc)
  window.removeEventListener('resize', moveIndicator)
})

watch(() => route.fullPath, () => (menuOpen.value = false))
watch([() => route.path, () => tabs.value.length], moveIndicator)
// 메뉴가 열려 있는 동안만 Esc를 받는다.
watch(menuOpen, (open) => (open ? window.addEventListener('keydown', closeOnEsc) : window.removeEventListener('keydown', closeOnEsc)))
</script>

<style scoped lang="scss">
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding-bottom: var(--safe-bottom);

  // 하단 탭이 내용을 가리지 않게 자리를 비워 둔다.
  @include mobile {
    &.has-tabbar {
      padding-bottom: calc(var(--safe-bottom) + var(--tabbar-height));
    }
  }
}

.top {
  view-transition-name: header;
  position: sticky;
  top: 0;
  z-index: 20;
  padding-top: var(--safe-top);
  background: var(--color-surface);
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

// 모바일 상세 화면 헤더: 로고 대신 뒤로가기와 제목을 보여 준다.
.bar-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 17px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;

  @include pc {
    display: none;
  }
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

.dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-danger);
  box-shadow: 0 0 0 2px var(--color-surface);
}

.menu-button {
  position: relative;
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
  position: relative;
  display: flex;
  gap: var(--space-1);
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 var(--space-3);
}

.tab {
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition:
    color 200ms ease,
    transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    color: var(--color-text);
  }

  &:active {
    transform: scale(0.96);
  }

  // 글자 굵기는 바꾸지 않는다(바뀌면 탭 폭이 달라져 막대 위치가 어긋난다).
  &.active {
    color: var(--color-primary);
  }
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--color-primary);

  &.animate {
    transition:
      transform 300ms cubic-bezier(0.32, 0.72, 0, 1),
      width 300ms cubic-bezier(0.32, 0.72, 0, 1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-indicator.animate {
    transition: none;
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

  // 문구 우측 상단에 붙는 빨간 점
  .dot {
    position: static;
    display: inline-block;
    margin-left: 2px;
    vertical-align: top;
    box-shadow: none;
  }

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

// 내용이 짧아도 남는 화면을 채워, 화면 이동 때 짧은 화면 아래로 이전 화면이 비쳐 보이지 않게 한다.
.content {
  flex: 1;
  width: 100%;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-5) var(--space-4) var(--space-8);

  &.wide {
    max-width: 1120px;
  }
}

// 아래 규칙들은 같은 요소의 기본 display보다 뒤에 와야 이긴다.
.mobile-only {
  @include pc {
    display: none;
  }
}

.hide-mobile {
  @include mobile {
    display: none;
  }
}

// 모바일에서는 헤더 아래 탭 대신 하단 탭을 쓴다.
.tabs {
  @include mobile {
    display: none;
  }
}
</style>
