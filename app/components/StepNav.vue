<script setup lang="ts">
import { CAMP_STEPS, type CampStep } from '~/constants/steps'

const props = defineProps<{ campId: string }>()
const route = useRoute()
const store = useCampStore()

function canVisit(path: CampStep['path']): boolean {
  return store.currentCamp ? canVisitStep(store.currentCamp, path) : false
}

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
        :class="{ active: index === currentIndex, done: index < currentIndex, locked: !canVisit(step.path) }"
      >
        <NuxtLink v-if="canVisit(step.path)" :to="`/camps/${props.campId}/${step.path}`" class="step">
          <span class="num">{{ index + 1 }}</span>
          <span class="label">{{ step.label }}</span>
        </NuxtLink>
        <span v-else class="step" aria-disabled="true" title="앞 단계를 먼저 입력해 주세요">
          <span class="num">{{ index + 1 }}</span>
          <span class="label">{{ step.label }}</span>
        </span>
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

  .step {
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

  .locked .step {
    opacity: 0.4;
    cursor: not-allowed;
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
