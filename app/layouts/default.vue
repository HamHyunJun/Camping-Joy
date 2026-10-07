<script setup lang="ts">
const route = useRoute()
const campId = computed(() => {
  const id = route.params.campId
  return typeof id === 'string' ? id : null
})
</script>

<template>
  <div class="layout">
    <header class="header">
      <NuxtLink to="/" class="logo">CampPack</NuxtLink>
    </header>
    <StepNav v-if="campId" :camp-id="campId" />
    <main class="content">
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
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.logo {
  font-weight: 700;
  font-size: 18px;
  color: var(--color-primary);
  text-decoration: none;
}

.content {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: var(--space-4);
}
</style>
