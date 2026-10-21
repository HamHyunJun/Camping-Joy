<template>
  <section v-if="camp">
    <div class="page-head">
      <h1 class="page-title">최종 배분 결과</h1>
      <button class="btn btn-primary share-button" type="button" :disabled="!rows.length" @click="sharing = true">
        공유하기
      </button>
    </div>

    <!-- 캠핑 정보 -->
    <article class="card summary">
      <div class="summary-head">
        <div>
          <h2 class="camp-name">{{ camp.name || '이름 없는 캠핑' }}</h2>
          <p class="camp-date">{{ format.formatDate(camp.date) }}</p>
        </div>
        <NuxtLink class="btn btn-text" :to="`/camps/${route.params.campId}/info`">수정</NuxtLink>
      </div>
      <div v-if="camp.place" class="place">
        <strong>{{ camp.place.name || '캠핑장' }}</strong>
        <p v-if="camp.place.address">{{ camp.place.address }}</p>
        <PlaceMap :place="camp.place" />
      </div>
      <dl class="stats">
        <div>
          <dt>멤버</dt>
          <dd>{{ members.length }}명</dd>
        </div>
        <div>
          <dt>챙길 장비</dt>
          <dd>{{ totalQuantity }}개</dd>
        </div>
      </dl>
    </article>

    <!-- 일정 -->
    <section v-if="schedule.length" class="block">
      <div class="block-head">
        <h2>일정</h2>
        <NuxtLink class="btn btn-text" :to="`/camps/${route.params.campId}/schedule`">수정</NuxtLink>
      </div>
      <div class="card schedule">
        <div v-for="group in scheduleByDay" :key="group.day" class="schedule-day">
          <h3 v-if="scheduleByDay.length > 1 || group.day > 1">{{ group.day }}일차 · {{ format.formatDayDate(camp.date, group.day) }}</h3>
          <ol>
            <li v-for="item in group.items" :key="item.id">
              <time>{{ item.time }}</time>
              <span>{{ item.title }}</span>
            </li>
          </ol>
        </div>
      </div>
    </section>

    <!-- 멤버 -->
    <section class="block">
      <div class="block-head">
        <h2>멤버</h2>
        <NuxtLink class="btn btn-text" :to="`/camps/${route.params.campId}/members`">수정</NuxtLink>
      </div>
      <ul class="member-chips">
        <li v-for="member in members" :key="member.id" class="chip">
          {{ member.name }} <small>{{ memberTotal(member) }}개</small>
        </li>
      </ul>
    </section>

    <!-- 배분 결과 -->
    <section class="block">
      <div class="block-head">
        <h2>장비</h2>
        <NuxtLink class="btn btn-text" :to="`/camps/${route.params.campId}/distribute`">배분 수정</NuxtLink>
      </div>

      <p v-if="!rows.length" class="empty">아직 배분한 장비가 없어요.</p>

      <div v-else class="member-cards">
        <article v-for="member in members" :key="member.id" class="card">
          <h3 class="member-name">{{ member.name }} <small>{{ memberTotal(member) }}개</small></h3>
          <p v-if="!member.equipments.length" class="muted">맡은 장비가 없어요.</p>
          <div v-for="group in groupByCategory.groupByCategory(member.equipments)" :key="group.category" class="group">
            <h4 class="group-label">{{ group.label }}</h4>
            <ul class="gear-rows">
              <li v-for="item in group.items" :key="item.id" class="gear-row">
                <span class="gear-text">
                  <span class="gear-title">{{ equipmentLabel.equipmentLabel(item) }}</span>
                  <small v-if="item.ownerId !== member.id" class="gear-owner">{{ ownerName(item.ownerId) }} 장비</small>
                </span>
                <span class="gear-qty">×{{ item.quantity }}</span>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <div class="page-actions">
      <NuxtLink class="btn" :to="`/camps/${route.params.campId}/meals`">이전</NuxtLink>
      <NuxtLink class="btn btn-primary" to="/">전체 캠핑으로</NuxtLink>
    </div>

    <ShareSheet v-if="sharing" :camp="camp" @close="sharing = false" />
  </section>
</template>

<script setup lang="ts">
import type { Equipment, ID, Member } from '~/types/camp'
import equipmentLabel from '~/utils/equipmentLabel'
import format from '~/utils/format'
import groupByCategory from '~/utils/groupByCategory'

const store = useCampStore()
const gear = useGearStore()
const route = useRoute()

interface ResultRow {
  key: string
  member: Member
  equipment: Equipment
}

const sharing = ref(false)

const camp = computed(() => store.currentCamp)
const members = computed(() => camp.value?.members ?? [])
const schedule = computed(() => format.sortSchedule(camp.value?.schedule ?? []))
const scheduleByDay = computed(() => format.scheduleGroups(schedule.value))
const rows = computed<ResultRow[]>(() =>
  members.value.flatMap((member) =>
    member.equipments.map((equipment) => ({ key: `${member.id}:${equipment.id}`, member, equipment })),
  ),
)
const totalQuantity = computed(() => rows.value.reduce((sum, row) => sum + row.equipment.quantity, 0))
const ownerName = (ownerId: ID): string =>
  members.value.find((m) => m.id === ownerId)?.name ?? gear.findPerson(ownerId)?.name ?? ''

const memberTotal = (member: Member): number => member.equipments.reduce((sum, e) => sum + e.quantity, 0)
</script>

<style scoped lang="scss">
.share-button {
  min-height: 40px;
  padding: 0 var(--space-4);
}

.summary-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.camp-name {
  margin: 0;
  font-size: 20px;
}

.camp-date {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.place {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);

  strong {
    display: block;
    font-size: 15px;
  }

  p {
    margin: 2px 0 0;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  .place-map {
    margin-top: var(--space-3);
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
  margin: var(--space-4) 0 var(--space-3);

  div {
    padding: var(--space-2);
    border-radius: 8px;
    background: var(--color-bg);
    text-align: center;
  }

  dt {
    color: var(--color-text-muted);
    font-size: 12px;
  }

  dd {
    margin: 2px 0 0;
    font-weight: 700;
  }
}

.schedule {
  display: grid;
  gap: var(--space-4);

  h3 {
    margin: 0 0 var(--space-2);
    color: var(--color-text-muted);
    font-size: 13px;
  }

  ol {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    gap: var(--space-3);
    font-size: 15px;
  }

  time {
    flex: none;
    width: 46px;
    color: var(--color-primary);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
}

.block {
  margin-top: var(--space-6);
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);

  h2 {
    margin: 0;
    font-size: 17px;
  }
}

.member-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  cursor: default;

  &:hover {
    border-color: var(--color-border);
    color: var(--color-text);
  }
}

.member-cards {
  display: grid;
  gap: var(--space-2);

  @include pc {
    grid-template-columns: 1fr 1fr;
  }
}

.member-name {
  margin: 0 0 var(--space-2);
  font-size: 16px;

  small {
    color: var(--color-text-muted);
    font-weight: 400;
  }
}

.group + .group {
  margin-top: var(--space-2);
}

.group-label {
  margin: 0 0 var(--space-1);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
}

.gear-rows {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.gear-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 32px;
  padding: 3px var(--space-2);
  border-radius: var(--radius-sm);
}

.gear-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.gear-owner {
  color: var(--color-text-muted);
  font-size: 12px;
}

.gear-qty {
  flex: none;
  min-width: 34px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.muted {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
}
</style>
