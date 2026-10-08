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
          <p class="camp-date">{{ formatDate(camp.date) }}</p>
        </div>
        <NuxtLink class="btn btn-text" :to="`/camps/${route.params.campId}/info`">수정</NuxtLink>
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
        <div>
          <dt>준비 완료</dt>
          <dd>{{ readyCount }} / {{ rows.length }}</dd>
        </div>
      </dl>
      <div class="progress" role="progressbar" :aria-valuenow="readyCount" :aria-valuemax="rows.length">
        <span :style="{ width: rows.length ? `${(readyCount / rows.length) * 100}%` : '0%' }" />
      </div>
    </article>

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
        <h2>누가 무엇을 챙기나요</h2>
        <NuxtLink class="btn btn-text" :to="`/camps/${route.params.campId}/distribute`">배분 수정</NuxtLink>
      </div>

      <div class="tabs" role="tablist">
        <button type="button" role="tab" :aria-selected="view === 'equipment'" @click="view = 'equipment'">장비별</button>
        <button type="button" role="tab" :aria-selected="view === 'member'" @click="view = 'member'">멤버별</button>
      </div>

      <p v-if="!rows.length" class="empty">아직 배분한 장비가 없어요.</p>

      <div v-else-if="view === 'equipment'" class="card table-wrap">
        <table class="result-table">
          <thead>
            <tr>
              <th>장비</th>
              <th>담당자</th>
              <th class="num">수량</th>
              <th class="state">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key" :class="{ ready: store.isReady(row.member.id, row.equipment.id) }">
              <td>
                {{ equipmentLabel(row.equipment) }}
                <small class="sub">{{ EQUIPMENT_CATEGORY_LABELS[row.equipment.category] }}</small>
              </td>
              <td>
                {{ row.member.name }}
                <small v-if="row.equipment.ownerId !== row.member.id" class="sub">{{ ownerName(row.equipment.ownerId) }} 장비</small>
              </td>
              <td class="num">{{ row.equipment.quantity }}</td>
              <td class="state">
                <button type="button" class="state-button" @click="store.toggleReady(row.member.id, row.equipment.id)">
                  {{ store.isReady(row.member.id, row.equipment.id) ? '완료' : '준비' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="member-cards">
        <article v-for="member in members" :key="member.id" class="card">
          <h3 class="member-name">{{ member.name }} <small>{{ memberTotal(member) }}개</small></h3>
          <p v-if="!member.equipments.length" class="muted">맡은 장비가 없어요.</p>
          <div v-for="group in groupByCategory(member.equipments)" :key="group.category" class="group">
            <h4 class="group-label">{{ group.label }}</h4>
            <ul class="plain-list">
              <li v-for="item in group.items" :key="item.id" :class="{ ready: store.isReady(member.id, item.id) }">
                <label>
                  <input
                    type="checkbox"
                    :checked="store.isReady(member.id, item.id)"
                    @change="store.toggleReady(member.id, item.id)"
                  />
                  {{ equipmentLabel(item) }} × {{ item.quantity }}
                  <small v-if="item.ownerId !== member.id" class="sub">{{ ownerName(item.ownerId) }} 장비</small>
                </label>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <!-- 배분 안 된 장비 -->
    <section v-if="unassigned.length" class="block">
      <div class="block-head">
        <h2>아무도 안 챙기는 장비</h2>
      </div>
      <ul class="card plain-list leftover">
        <li v-for="{ owned, left } in unassigned" :key="owned.id">
          {{ equipmentLabel(owned) }} <small class="sub">{{ ownerName(owned.ownerId) }} · {{ left }}개</small>
        </li>
      </ul>
    </section>

    <div class="page-actions">
      <NuxtLink class="btn" :to="`/camps/${route.params.campId}/distribute`">이전</NuxtLink>
      <NuxtLink class="btn btn-primary" to="/">전체 캠핑으로</NuxtLink>
    </div>

    <ShareSheet v-if="sharing" :camp="camp" @close="sharing = false" />
  </section>
</template>

<script setup lang="ts">
import type { Equipment, ID, Member } from '~/types/camp'
import { EQUIPMENT_CATEGORY_LABELS } from '~/constants/equipment'

const store = useCampStore()
const gear = useGearStore()
const route = useRoute()

const camp = computed(() => store.currentCamp)
const members = computed(() => camp.value?.members ?? [])
const view = ref<'equipment' | 'member'>('equipment')
const sharing = ref(false)

interface ResultRow {
  key: string
  member: Member
  equipment: Equipment
}

const categoryOrder = Object.keys(EQUIPMENT_CATEGORY_LABELS)

/** 장비별 표: 카테고리 → 장비 이름 순으로 정렬 */
const rows = computed<ResultRow[]>(() =>
  members.value
    .flatMap((member) => member.equipments.map((equipment) => ({ key: `${member.id}:${equipment.id}`, member, equipment })))
    .sort(
      (a, b) =>
        categoryOrder.indexOf(a.equipment.category) - categoryOrder.indexOf(b.equipment.category) ||
        equipmentLabel(a.equipment).localeCompare(equipmentLabel(b.equipment), 'ko'),
    ),
)

const totalQuantity = computed(() => rows.value.reduce((sum, row) => sum + row.equipment.quantity, 0))
const readyCount = computed(() => rows.value.filter((row) => store.isReady(row.member.id, row.equipment.id)).length)

/** 멤버들이 가졌지만 아무에게도 배분되지 않은 장비 */
const unassigned = computed(() =>
  members.value
    .flatMap((m) => gear.findPerson(m.id)?.equipments ?? [])
    .map((owned) => ({ owned, left: owned.quantity - store.assignedQuantity(owned.id) }))
    .filter((item) => item.left > 0),
)

function ownerName(ownerId: ID): string {
  return members.value.find((m) => m.id === ownerId)?.name ?? gear.findPerson(ownerId)?.name ?? ''
}

function memberTotal(member: Member): number {
  return member.equipments.reduce((sum, e) => sum + e.quantity, 0)
}
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

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

.progress {
  height: 6px;
  overflow: hidden;
  border-radius: 3px;
  background: var(--color-border);

  span {
    display: block;
    height: 100%;
    background: var(--color-primary);
    transition: width 0.2s;
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

.tabs {
  display: inline-flex;
  margin-bottom: var(--space-3);
  padding: 3px;
  border-radius: 999px;
  background: var(--color-border);

  button {
    min-height: 34px;
    padding: 0 var(--space-4);
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--color-text-muted);
    font: inherit;
    font-size: 14px;
    cursor: pointer;

    &[aria-selected='true'] {
      background: var(--color-surface);
      color: var(--color-text);
      font-weight: 600;
    }
  }
}

.table-wrap {
  padding: 0;
  overflow-x: auto;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;

  th,
  td {
    padding: var(--space-3);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    vertical-align: middle;
  }

  th {
    background: var(--color-bg);
    color: var(--color-text-muted);
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  .num,
  .state {
    text-align: center;
    white-space: nowrap;
  }

  tr.ready td:not(.state) {
    color: var(--color-text-muted);
  }
}

.sub {
  display: block;
  color: var(--color-text-muted);
  font-size: 12px;
}

.state-button {
  min-width: 52px;
  min-height: 30px;
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
  cursor: pointer;

  .ready & {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: #fff;
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

.plain-list {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    padding: 6px 0;
  }

  li.ready {
    color: var(--color-text-muted);
    text-decoration: line-through;
  }

  label {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
  }

  .sub {
    display: inline;
  }
}

.leftover {
  padding: var(--space-1) var(--space-4);

  li + li {
    border-top: 1px solid var(--color-border);
  }
}

.muted {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
}
</style>
