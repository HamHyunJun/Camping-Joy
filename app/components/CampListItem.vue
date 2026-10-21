<template>
  <li class="card camp-item">
    <NuxtLink :to="`/camps/${camp.id}/${progress.step}`" class="camp-link">
      <span class="date-block">
        <small>{{ dateParts(camp.date).month }}</small>
        <strong>{{ dateParts(camp.date).day }}</strong>
      </span>
      <span class="camp-body">
        <span class="camp-name">
          <strong>{{ camp.name || '이름 없는 캠핑' }}</strong>
          <span v-if="dday" class="dday" :class="{ past: dday === '지난 캠핑' }">{{ dday }}</span>
        </span>
        <span class="meta">{{ format.formatDate(camp.date) }} · 멤버 {{ camp.members.length }}명</span>
        <span class="status">
          <span class="status-label" :class="{ complete: progress.label === '계획 완료' }">
            {{ progress.label }}
          </span>
        </span>
      </span>
    </NuxtLink>
    <button class="delete" type="button" :aria-label="`${camp.name || '이름 없는 캠핑'} 삭제`" @click="removeCamp(camp)">
      <img :src="trashIcon" alt="" width="20" height="20" />
    </button>
  </li>
</template>

<script setup lang="ts">
import trashIcon from '~/assets/icons/trash.svg'
import type { Camp } from '~/types/camp'
import campSteps from '~/utils/campSteps'
import format from '~/utils/format'

const props = defineProps<{ camp: Camp }>()

const store = useCampStore()

const progress = computed(() => campSteps.campProgress(props.camp))
const dday = computed(() => format.formatDday(props.camp.date))

const removeCamp = (camp: Camp): void => {
  if (!confirm(`'${camp.name || '이름 없는 캠핑'}'을(를) 삭제할까요?\n모든 사람의 전체 캠핑에서 지워져요.`)) return
  store.deleteCamp(camp.id)
}

const dateParts = (date: string): { month: string; day: string } => {
  const [, month = '', day = ''] = date.split('-')
  return { month: `${Number(month)}월`, day: String(Number(day)) }
}
</script>

<style scoped lang="scss">
.camp-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);

  &:hover {
    box-shadow: var(--shadow-md);
  }
}

.camp-link {
  display: flex;
  flex: 1;
  gap: var(--space-3);
  min-width: 0;
  text-decoration: none;
}

.date-block {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 56px;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  line-height: 1.1;

  small {
    font-size: 12px;
    font-weight: 600;
  }

  strong {
    font-size: 20px;
  }
}

.camp-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.camp-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;

  strong {
    overflow: hidden;
    font-size: 17px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dday {
  flex: none;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 700;

  &.past {
    background: var(--color-surface-muted);
    color: var(--color-text-subtle);
  }
}

.meta {
  color: var(--color-text-muted);
  font-size: 14px;
}

.status {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  font-size: 13px;
}

.status-label {
  flex: none;
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-weight: 600;

  &.complete {
    border-color: transparent;
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }
}

.delete {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;

  &:hover {
    background: var(--color-danger-soft);
  }
}
</style>
