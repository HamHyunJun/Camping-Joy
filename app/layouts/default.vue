<script setup lang="ts">
import menuIcon from '~/assets/icons/menu.svg'

const route = useRoute()
const campId = computed(() => {
  const id = route.params.campId
  return typeof id === 'string' ? id : null
})

const menuOpen = ref(false)
watch(() => route.fullPath, () => (menuOpen.value = false))

const menuItems = [
  { to: '/', label: '내 캠핑' },
  { to: '/gear', label: '멤버·장비 등록' },
]
</script>

<template>
  <div class="layout">
    <header class="header">
      <NuxtLink to="/" class="logo">CampPack</NuxtLink>
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

    <div v-if="menuOpen" class="menu-backdrop" @click="menuOpen = false" />
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
    <main class="content" :class="{ wide: route.meta.wide }">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.layout {
  min-height: 100dvh;
  padding-top: var(--safe-top);
  padding-bottom: var(--safe-bottom);
}

.header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 var(--space-2) 0 var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.logo {
  font-weight: 700;
  font-size: 18px;
  color: var(--color-primary);
  text-decoration: none;
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

.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10;
  background: rgb(0 0 0 / 20%);
}

.menu {
  position: absolute;
  top: calc(56px + var(--safe-top));
  right: var(--space-2);
  z-index: 30;
  display: flex;
  flex-direction: column;
  min-width: 200px;
  padding: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
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
  padding: var(--space-4);

  &.wide {
    max-width: 1120px;
  }
}
</style>
