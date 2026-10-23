<template>
  <nav class="step-nav" aria-label="캠핑 준비 단계">
    <ol>
      <li
        v-for="(step, index) in CAMP_STEPS"
        :key="step.path"
        :class="{ active: index === currentIndex, done: isDone(step.path), locked: !canVisit(step.path) }"
      >
        <NuxtLink
          v-if="canVisit(step.path)"
          :to="group.path(`/camps/${props.campId}/${step.path}`)"
          class="step"
          :aria-current="index === currentIndex ? 'step' : undefined"
        >
          <span class="num">{{ isDone(step.path) && index !== currentIndex ? '✓' : index + 1 }}</span>
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

<script setup lang="ts">
import { CAMP_STEPS, type CampStep } from '~/constants/steps'
import campSteps from '~/utils/campSteps'

const props = defineProps<{ campId: string }>()

const group = useGroupStore()

const route = useRoute()
const store = useCampStore()

const currentIndex = computed(() =>
  CAMP_STEPS.findIndex((step) => route.path.endsWith(`/${step.path}`)),
)

const canVisit = (path: CampStep['path']): boolean =>
  store.currentCamp ? campSteps.canVisitStep(store.currentCamp, path) : false

const isDone = (path: CampStep['path']): boolean => {
  if (!store.currentCamp || path === 'result') return false
  // 일정은 하나라도 적었을 때만 완료로 보여 준다.
  if (path === 'schedule') return Boolean(store.currentCamp.schedule?.length)
  if (path === 'meals') {
    const camp = store.currentCamp
    return Boolean(camp.shopping?.length || camp.menus?.some((m) => m.menu))
  }
  return campSteps.isStepComplete(store.currentCamp, path)
}
</script>

<style scoped lang="scss">
.step-nav {
  border-top: 1px solid var(--color-border);
  overflow-x: auto;
  scrollbar-width: none;

  ol {
    display: flex;
    align-items: center;
    max-width: var(--content-max);
    margin: 0 auto;
    padding: var(--space-2) var(--space-4);
    list-style: none;
  }

  li {
    display: flex;
    flex: 1;
    align-items: center;

    /* 단계 사이 연결선 */
    &:not(:last-child)::after {
      content: '';
      flex: 1;
      min-width: 12px;
      height: 2px;
      margin: 0 var(--space-1);
      border-radius: 1px;
      background: var(--color-border);
    }

    &.done:not(:last-child)::after {
      background: var(--color-primary);
    }

    &:last-child {
      flex: none;
    }
  }

  .step {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: var(--space-1) var(--space-2) var(--space-1) var(--space-1);
    border-radius: 999px;
    color: var(--color-text-muted);
    text-decoration: none;
    white-space: nowrap;
    font-size: 14px;
  }

  a.step:hover {
    background: var(--color-surface-muted);
  }

  .num {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    font-size: 12px;
    font-weight: 700;
  }

  .locked .step {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .done .step {
    color: var(--color-text);

    .num {
      border-color: var(--color-primary);
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }
  }

  .active .step {
    color: var(--color-primary);
    font-weight: 700;

    .num {
      border-color: var(--color-primary);
      background: var(--color-primary);
      color: #fff;
    }
  }

  // 휴대폰: 이름을 번호 아래에 두어 다섯 단계가 한 화면에 다 들어오게 한다.
  @include mobile {
    ol {
      padding: var(--space-2) var(--space-3);
    }

    li {
      align-items: flex-start;

      &:not(:last-child)::after {
        min-width: 8px;
        margin: 14px 2px 0;
      }
    }

    .step {
      flex-direction: column;
      gap: 2px;
      padding: 2px;
      border-radius: 8px;
    }

    .label {
      font-size: 11px;
    }
  }
}
</style>
