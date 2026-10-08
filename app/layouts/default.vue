<template>
  <div class="layout">
    <!-- 헤더의 backdrop-filter가 fixed 기준이 되지 않도록 밖에 둔다 -->
    <div v-if="menuOpen" class="menu-backdrop" @click="menuOpen = false" />
    <div class="top">
      <header class="header">
        <NuxtLink to="/" class="logo">
          <span class="logo-mark"><img :src="tentIcon" alt="" width="18" height="18" /></span>
          Camping&amp;Joy
        </NuxtLink>
        <!-- PC: 헤더에 메뉴 나열 -->
        <nav class="header-nav" aria-label="메뉴">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="header-nav-item"
            :class="{ active: route.path === item.to }"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
        <!-- 모바일: 더보기 아이콘 -->
        <button
          class="menu-button"
          type="button"
          :aria-expanded="menuOpen"
          aria-label="메뉴"
          @click="menuOpen = !menuOpen"
        >
          <img :src="menuIcon" alt="" width="24" height="24" />
        </button>
      </header>

      <nav v-if="menuOpen" class="menu">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="menu-item"
          :class="{ active: route.path === item.to }"
        >
          {{ item.label }}
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
const campId = computed(() => {
  const id = route.params.campId
  return typeof id === 'string' ? id : null
})

const menuOpen = ref(false)
watch(() => route.fullPath, () => (menuOpen.value = false))

const menuItems = [
  { to: '/', label: '전체 캠핑' },
  { to: '/gear', label: '멤버·장비 등록' },
]
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

.header-nav {
  display: flex;
  gap: var(--space-1);

  @include mobile {
    display: none;
  }
}

.header-nav-item {
  padding: var(--space-2) var(--space-3);
  border-radius: 8px;
  color: var(--color-text-muted);
  text-decoration: none;

  &:hover {
    color: var(--color-text);
  }

  &.active {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: 600;
  }
}

.menu-button {
  display: none;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  @include mobile {
    display: grid;
  }
}

.menu-backdrop,
.menu {
  @include pc {
    display: none !important;
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
  top: calc(var(--header-height) + var(--safe-top));
  right: var(--space-2);
  z-index: 30;
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

.content {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-5) var(--space-4) var(--space-8);

  &.wide {
    max-width: 1120px;
  }
}
</style>
