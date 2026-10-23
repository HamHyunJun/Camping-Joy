<template>
  <span v-if="label" class="role-badge" :class="role" :title="label">
    <svg v-if="role === 'owner'" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path d="m2 4 3 12h14l3-12-6 4-4-6-4 6-6-4Z" />
      <path d="M5 20h14" />
    </svg>
    <svg v-else viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
    <span class="sr-only">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import type { GroupRole } from '~/types/database'

const props = defineProps<{ role: GroupRole | undefined }>()

// 관리자와 운영진만 이름 옆에 아이콘을 보여 준다.
const label = computed(() => (props.role === 'owner' ? '관리자' : props.role === 'admin' ? '운영진' : ''))
</script>

<style scoped lang="scss">
.role-badge {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  vertical-align: middle;

  svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &.owner {
    background: var(--color-accent-soft);
    color: var(--color-accent);
  }

  &.admin {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }
}
</style>
