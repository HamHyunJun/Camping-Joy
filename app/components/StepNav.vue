<script setup lang="ts">
import { CAMP_STEPS } from '~/constants/steps'

const props = defineProps<{ campId: string }>()
const route = useRoute()

const currentIndex = computed(() =>
  CAMP_STEPS.findIndex((step) => route.path.endsWith(`/${step.path}`)),
)
</script>

<template>
  <nav class="step-nav">
    <ol>
      <li
        v-for="(step, index) in CAMP_STEPS"
        :key="step.path"
        :class="{ active: index === currentIndex, done: index < currentIndex }"
      >
        <NuxtLink :to="`/camps/${props.campId}/${step.path}`">
          <span class="num">{{ index + 1 }}</span>
          <span class="label">{{ step.label }}</span>
        </NuxtLink>
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.step-nav {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;

  ol {
    display: flex;
    gap: var(--space-2);
    max-width: var(--content-max);
    margin: 0 auto;
    padding: var(--space-3) var(--space-4);
    list-style: none;
  }

  a {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border-radius: 999px;
    color: var(--color-text-muted);
    text-decoration: none;
    white-space: nowrap;
    font-size: 14px;
  }

  .num {
    display: inline-grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-border);
    font-size: 12px;
  }

  .done a {
    color: var(--color-primary);
  }

  .active a {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: 600;

    .num {
      background: var(--color-primary);
      color: #fff;
    }
  }
}
</style>
