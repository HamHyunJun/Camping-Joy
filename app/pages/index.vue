<script setup lang="ts">
import tentIcon from '~/assets/icons/tent.svg'
import trashIcon from '~/assets/icons/trash.svg'
import type { Camp } from '~/types/camp'

const store = useCampStore()
const gear = useGearStore()

// 정보를 입력하지 않고 나온 빈 캠핑은 목록에 남기지 않는다.
store.removeEmptyDrafts()

const gearCount = computed(() => gear.people.reduce((sum, p) => sum + p.equipments.length, 0))

const camps = computed(() =>
  store.sortedCamps.map((camp) => ({ camp, progress: campProgress(camp), dday: formatDday(camp.date) })),
)

function startNewCamp() {
  const campId = store.createCamp()
  navigateTo(`/camps/${campId}/info`)
}

function removeCamp(camp: Camp) {
  if (!confirm(`'${camp.name || '이름 없는 캠핑'}'을(를) 삭제할까요?`)) return
  store.deleteCamp(camp.id)
}

function dateParts(date: string): { month: string; day: string } {
  const [, month = '', day = ''] = date.split('-')
  return { month: `${Number(month)}월`, day: String(Number(day)) }
}
</script>

<template>
  <section>
    <div class="hero">
      <div>
        <h1 class="page-title">내 캠핑</h1>
        <p class="hero-desc">누가 무엇을 챙길지 한 번에 정리해요.</p>
      </div>
      <button class="btn btn-primary" type="button" @click="startNewCamp">+ 새 캠핑</button>
    </div>

    <NuxtLink to="/gear" class="card gear-link">
      <span class="avatar gear-icon"><img :src="tentIcon" alt="" width="20" height="20" /></span>
      <span class="gear-text">
        <strong>멤버·장비 등록</strong>
        <span class="meta">
          {{
            gear.people.length
              ? `${gear.people.length}명 · 장비 ${gearCount}종 등록됨`
              : '캠핑 전에 사람별 장비를 먼저 등록해 두세요'
          }}
        </span>
      </span>
      <span class="chevron" aria-hidden="true">›</span>
    </NuxtLink>

    <h2 v-if="camps.length" class="section-title list-title">캠핑 {{ camps.length }}개</h2>
    <ul v-if="camps.length" class="camp-list">
      <li v-for="{ camp, progress, dday } in camps" :key="camp.id" class="card camp-item">
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
            <span class="meta">{{ formatDate(camp.date) }} · 멤버 {{ camp.members.length }}명</span>
            <span class="status">
              <span class="status-label" :class="{ complete: progress.label === '준비 완료' }">
                {{ progress.label }}
              </span>
              <template v-if="progress.step === 'result' && progress.total">
                <span class="bar"><span :style="{ width: `${(progress.ready / progress.total) * 100}%` }" /></span>
                <span class="ratio">{{ progress.ready }}/{{ progress.total }}</span>
              </template>
            </span>
          </span>
        </NuxtLink>
        <button class="delete" type="button" :aria-label="`${camp.name || '이름 없는 캠핑'} 삭제`" @click="removeCamp(camp)">
          <img :src="trashIcon" alt="" width="20" height="20" />
        </button>
      </li>
    </ul>
    <div v-else class="empty empty-camps">
      <img :src="tentIcon" alt="" width="40" height="40" />
      <strong>아직 만든 캠핑이 없어요</strong>
      <span>새 캠핑을 만들어 준비를 시작해 보세요.</span>
      <button class="btn btn-primary" type="button" @click="startNewCamp">+ 새 캠핑 만들기</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-5);

  .page-title {
    margin-bottom: 0;
  }
}

.hero-desc {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.gear-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  text-decoration: none;

  &:hover {
    border-color: var(--color-primary);
  }
}

.gear-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.gear-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.chevron {
  color: var(--color-text-subtle);
  font-size: 24px;
}

.list-title {
  margin-bottom: var(--space-3);
  color: var(--color-text-muted);
  font-size: 14px;
}

.camp-list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;

  @include pc {
    grid-template-columns: 1fr 1fr;
  }
}

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

.bar {
  flex: 1;
  height: 6px;
  max-width: 140px;
  border-radius: 3px;
  background: var(--color-border);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    background: var(--color-primary);
  }
}

.ratio {
  color: var(--color-text-muted);
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

.empty-camps {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-surface);

  strong {
    color: var(--color-text);
    font-size: 16px;
  }

  .btn {
    margin-top: var(--space-2);
  }
}
</style>
