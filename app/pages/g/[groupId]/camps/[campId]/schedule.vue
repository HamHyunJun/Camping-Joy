<template>
  <section v-if="camp">
    <div class="page-head">
      <h1 class="page-title">일정</h1>
      <button
        v-if="days.length > 1"
        class="btn btn-text btn-danger"
        type="button"
        @click="removeDay"
      >
        {{ currentDay }}일차 지우기
      </button>
    </div>
    <p class="page-desc">시간별로 캠핑 일정을 짜 보세요. 비워 둬도 결과를 볼 수 있어요.</p>

    <!-- 날짜 -->
    <div class="days" role="tablist" aria-label="날짜">
      <button
        v-for="day in days"
        :key="day"
        type="button"
        role="tab"
        class="day-tab"
        :aria-selected="day === currentDay"
        @click="currentDay = day"
      >
        <strong>{{ day }}일차</strong>
        <small>{{ format.formatDayDate(camp.date, day) }}</small>
      </button>
      <button type="button" class="day-tab add-day" @click="addDay">+ 하루 추가</button>
    </div>

    <!-- 추가 -->
    <form class="card add-card" @submit.prevent="addItem">
      <div class="add-row">
        <SelectMenu v-model="form.time" class="time-select" :options="timeOptions" aria-label="시간" />
        <input
          ref="titleInput"
          v-model="form.title"
          class="input"
          type="text"
          placeholder="할 일"
          maxlength="40"
          autocomplete="off"
        />
        <button class="btn btn-primary" type="submit" :disabled="!form.title.trim()">추가</button>
      </div>
      <div class="presets">
        <button v-for="preset in SCHEDULE_PRESETS" :key="preset" type="button" class="chip" @click="pickPreset(preset)">
          {{ preset }}
        </button>
      </div>
    </form>

    <!-- 일정표 -->
    <ol v-if="dayItems.length" class="timeline">
      <li v-for="item in dayItems" :key="item.id" class="timeline-item">
        <span class="dot" aria-hidden="true" />
        <SelectMenu
          class="item-time"
          size="sm"
          :model-value="item.time"
          :options="timeOptions"
          aria-label="시간"
          @update:model-value="store.updateScheduleItem(item.id, { time: $event })"
        />
        <input
          class="item-title"
          type="text"
          maxlength="40"
          :value="item.title"
          aria-label="할 일"
          @change="store.updateScheduleItem(item.id, { title: ($event.target as HTMLInputElement).value })"
        />
        <button class="remove" type="button" :aria-label="`${item.time} ${item.title} 지우기`" @click="store.removeScheduleItem(item.id)">
          ×
        </button>
      </li>
    </ol>
    <p v-else class="empty">{{ currentDay }}일차 일정이 아직 없어요. 위에서 시간과 할 일을 넣어 보세요.</p>

    <div class="page-actions">
      <NuxtLink class="btn" :to="group.path(`/camps/${route.params.campId}/distribute`)">이전</NuxtLink>
      <NuxtLink class="btn btn-primary" :to="group.path(`/camps/${route.params.campId}/meals`)">다음: 음식 정하기</NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { SelectMenuOption } from '~/components/SelectMenu.vue'
import format from '~/utils/format'

const group = useGroupStore()

const store = useCampStore()
const { ask } = useConfirm()
const route = useRoute()

const SCHEDULE_PRESETS = ['집합', '출발', '입실', '텐트 치기', '점심', '저녁', '불멍', '취침', '아침', '정리', '퇴실']
/** 30분 단위 시간 */
const timeOptions: SelectMenuOption[] = Array.from({ length: 48 }, (_, i) => {
  const time = `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`
  return { value: time, label: time }
})
// 일정이 없는 날도 탭으로 보여 줄 수 있게, 추가한 날 수를 따로 기억한다.
const addedDays = ref(1)
const currentDay = ref(1)
const form = reactive({ time: '11:00', title: '' })
const titleInput = ref<HTMLInputElement>()

const camp = computed(() => store.currentCamp)
const days = computed(() => {
  const last = Math.max(addedDays.value, ...(camp.value?.schedule ?? []).map((s) => s.day))
  return Array.from({ length: last }, (_, i) => i + 1)
})
const dayItems = computed(() => format.sortSchedule((camp.value?.schedule ?? []).filter((s) => s.day === currentDay.value)))

/** 그날 마지막 일정 한 시간 뒤를 기본 시간으로 */
const nextTime = (): string => {
  const last = dayItems.value[dayItems.value.length - 1]
  if (!last) return currentDay.value === 1 ? '11:00' : '08:00'
  const hour = Math.min(Number(last.time.slice(0, 2)) + 1, 23)
  return `${String(hour).padStart(2, '0')}:${last.time.slice(3)}`
}

const addItem = (): void => {
  if (!form.title.trim()) return
  store.addScheduleItem({ day: currentDay.value, time: form.time, title: form.title })
  form.title = ''
  form.time = nextTime()
}

const pickPreset = (preset: string): void => {
  form.title = preset
  titleInput.value?.focus()
}

const addDay = (): void => {
  addedDays.value = days.value.length + 1
  currentDay.value = addedDays.value
}

const removeDay = async (): Promise<void> => {
  const day = currentDay.value
  const count = dayItems.value.length
  if (count && !(await ask({ title: '일정 지우기', message: `${day}일차 일정 ${count}개를 모두 지울까요?`, confirmLabel: '지우기', danger: true }))) return
  store.removeScheduleDay(day)
  addedDays.value = Math.max(1, addedDays.value - 1)
  currentDay.value = Math.max(1, day - 1)
}

watch(currentDay, () => (form.time = nextTime()), { immediate: true })
</script>

<style scoped lang="scss">
.days {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  overflow-x: auto;
  scrollbar-width: none;
}

.day-tab {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-start;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;

  strong {
    font-size: 15px;
  }

  small {
    color: var(--color-text-muted);
    font-size: 12px;
  }

  &[aria-selected='true'] {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
    color: var(--color-primary);

    small {
      color: var(--color-primary);
    }
  }

  &.add-day {
    justify-content: center;
    border-style: dashed;
    color: var(--color-text-muted);
    font-size: 14px;
  }
}

.add-card {
  margin-bottom: var(--space-5);
}

.add-row {
  display: grid;
  grid-template-columns: 104px 1fr auto;
  gap: var(--space-2);
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);

  .chip {
    background: var(--color-surface-muted);
    cursor: pointer;
  }
}

.timeline {
  position: relative;
  margin: 0;
  padding: 0 0 0 var(--space-5);
  list-style: none;

  // 세로 줄
  &::before {
    content: '';
    position: absolute;
    top: 12px;
    bottom: 12px;
    left: 7px;
    width: 2px;
    background: var(--color-primary);
    opacity: 0.25;
  }
}

.timeline-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 52px;
  margin-bottom: var(--space-2);
  padding: var(--space-1) var(--space-2) var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.dot {
  position: absolute;
  top: 50%;
  left: calc(-1 * var(--space-5) + 2px);
  width: 12px;
  height: 12px;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  background: var(--color-surface);
  transform: translateY(-50%);
}

.item-time {
  flex: none;
  width: 84px;

  :deep(.select-trigger) {
    color: var(--color-primary);
    font-weight: 700;
  }
}

.item-title {
  flex: 1;
  min-width: 0;
  padding: var(--space-1) var(--space-2);
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: 15px;

  &:hover,
  &:focus {
    border-color: var(--color-border);
    outline: none;
  }
}

.remove {
  flex: none;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-subtle);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: var(--color-danger-soft);
    color: var(--color-danger);
  }
}
</style>
