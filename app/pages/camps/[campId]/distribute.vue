<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { Equipment, ID } from '~/types/camp'

definePageMeta({ wide: true })

const store = useCampStore()
const gear = useGearStore()
const route = useRoute()

const members = computed(() => store.currentCamp?.members ?? [])
const selectedId = ref<ID | null>(members.value[0]?.id ?? null)
const selected = computed(() => members.value.find((m) => m.id === selectedId.value) ?? null)

/** 이번 캠핑 멤버들이 등록해 둔 장비 전체. 선택한 멤버의 장비가 먼저 오도록 정렬한다. */
const pool = computed<Equipment[]>(() => {
  const all = members.value.flatMap((m) => gear.findPerson(m.id)?.equipments ?? [])
  return [...all].sort((a, b) => Number(b.ownerId === selectedId.value) - Number(a.ownerId === selectedId.value))
})
const poolGroups = computed(() => groupByCategory(pool.value))
const assignedGroups = computed(() => groupByCategory(selected.value?.equipments ?? []))

const dragGroup = 'distribute'

function ownerName(ownerId: ID): string {
  return members.value.find((m) => m.id === ownerId)?.name ?? gear.findPerson(ownerId)?.name ?? ''
}

function remaining(owned: Equipment): number {
  return owned.quantity - store.assignedQuantity(owned.id)
}

function ownedOf(equipmentId: ID): Equipment | undefined {
  return pool.value.find((e) => e.id === equipmentId)
}

function assign(owned: Equipment) {
  if (selected.value) store.addMemberEquipment(selected.value.id, owned)
}

function assignAgain(item: Equipment) {
  const owned = ownedOf(item.id)
  if (owned) assign(owned)
}

function unassign(item: Equipment) {
  if (selected.value) store.removeMemberEquipment(selected.value.id, item.id)
}

/** 보유 장비를 담당 장비 영역에 놓았을 때. 새로 들어온 항목만 찾아 배분한다. */
function onDrop(list: Equipment[]) {
  const dropped = list.find((item) => !selected.value?.equipments.includes(item))
  if (dropped) assign(dropped)
}

function assignedCount(memberId: ID): number {
  const member = members.value.find((m) => m.id === memberId)
  return member?.equipments.reduce((sum, e) => sum + e.quantity, 0) ?? 0
}

const keepItem = (item: Equipment) => item
const ignore = () => {}
</script>

<template>
  <section>
    <h1 class="page-title">장비 배분</h1>
    <p class="page-desc">멤버를 고르고, 오른쪽 장비를 끌어다 놓거나 + 를 눌러 그 멤버가 챙길 장비를 정해 주세요.</p>

    <p v-if="!members.length" class="empty">먼저 멤버를 추가해 주세요.</p>

    <div v-else class="board">
      <!-- 멤버 -->
      <nav class="panel members-panel" aria-label="멤버">
        <h2 class="panel-title">멤버</h2>
        <ul class="member-list">
          <li v-for="member in members" :key="member.id">
            <button
              type="button"
              class="member-button"
              :class="{ active: member.id === selectedId }"
              @click="selectedId = member.id"
            >
              <span class="name">{{ member.name }}</span>
              <span class="badge">{{ assignedCount(member.id) }}</span>
            </button>
          </li>
        </ul>
      </nav>

      <!-- 선택한 멤버의 담당 장비 -->
      <section class="panel">
        <h2 class="panel-title">{{ selected ? `${selected.name}님이 챙길 장비` : '멤버를 골라 주세요' }}</h2>
        <VueDraggable
          v-if="selected"
          :model-value="selected.equipments"
          class="drop-zone"
          :class="{ empty: !selected.equipments.length }"
          :group="{ name: dragGroup, pull: false, put: true }"
          :sort="false"
          @update:model-value="onDrop"
        >
          <template v-if="selected.equipments.length">
            <div v-for="group in assignedGroups" :key="group.category" class="group">
              <h3 class="group-label">{{ group.label }}</h3>
              <ul class="gear-list">
                <li v-for="item in group.items" :key="item.id" class="gear-item">
                  <span class="gear-name">
                    {{ item.name }}
                    <small v-if="item.ownerId !== selected.id" class="owner">{{ ownerName(item.ownerId) }} 장비</small>
                  </span>
                  <div class="stepper">
                    <button type="button" class="round" aria-label="하나 빼기" @click="unassign(item)">−</button>
                    <span>{{ item.quantity }}</span>
                    <button
                      type="button"
                      class="round"
                      aria-label="하나 더"
                      :disabled="!ownedOf(item.id) || remaining(ownedOf(item.id)!) < 1"
                      @click="assignAgain(item)"
                    >
                      +
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </template>
          <p v-else class="hint">오른쪽 장비를 여기로 끌어 놓거나 + 를 눌러 주세요.</p>
        </VueDraggable>
      </section>

      <!-- 멤버들이 가진 장비 -->
      <section class="panel">
        <h2 class="panel-title">멤버들이 가진 장비</h2>
        <p v-if="!pool.length" class="hint">
          등록된 장비가 없어요. <NuxtLink to="/gear">멤버·장비 등록</NuxtLink>에서 추가해 주세요.
        </p>
        <div v-for="group in poolGroups" :key="group.category" class="group">
          <h3 class="group-label">{{ group.label }}</h3>
          <VueDraggable
            :model-value="group.items"
            tag="ul"
            class="gear-list"
            :group="{ name: dragGroup, pull: 'clone', put: false }"
            :sort="false"
            :clone="keepItem"
            filter=".is-used-up"
            :delay="150"
            :delay-on-touch-only="true"
            @update:model-value="ignore"
          >
            <li
              v-for="item in group.items"
              :key="item.id"
              class="gear-item pool-item"
              :class="{ 'is-used-up': remaining(item) < 1, mine: item.ownerId === selectedId }"
            >
              <span class="gear-name">
                {{ item.name }}
                <small class="owner">{{ ownerName(item.ownerId) }}</small>
              </span>
              <span class="qty">남은 {{ remaining(item) }}</span>
              <button
                type="button"
                class="round"
                :disabled="!selected || remaining(item) < 1"
                aria-label="배분"
                @click="assign(item)"
              >
                +
              </button>
            </li>
          </VueDraggable>
        </div>
      </section>
    </div>

    <div class="page-actions">
      <NuxtLink class="btn" :to="`/camps/${route.params.campId}/members`">이전</NuxtLink>
      <NuxtLink class="btn btn-primary" :to="`/camps/${route.params.campId}/result`">다음: 결과 보기</NuxtLink>
    </div>
  </section>
</template>

<style scoped lang="scss">
.board {
  display: grid;
  gap: var(--space-3);

  @media (min-width: 860px) {
    grid-template-columns: 180px 1fr 1fr;
    align-items: start;
  }
}

.panel {
  min-width: 0;
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.panel-title {
  margin: 0 0 var(--space-3);
  font-size: 15px;
}

// 모바일에서는 멤버를 가로 칩으로, 넓은 화면에서는 세로 목록으로
.member-list {
  display: flex;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  overflow-x: auto;
  list-style: none;

  @media (min-width: 860px) {
    flex-direction: column;
    overflow: visible;
  }
}

.member-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  min-height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  white-space: nowrap;
  cursor: pointer;

  @media (min-width: 860px) {
    border-radius: 8px;
  }

  &.active {
    border-color: var(--color-primary);
    background: var(--color-primary);
    color: #fff;

    .badge {
      background: rgb(255 255 255 / 25%);
      color: #fff;
    }
  }
}

.badge {
  min-width: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.group + .group {
  margin-top: var(--space-3);
}

.group-label {
  margin: 0 0 var(--space-1);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
}

.gear-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.gear-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 0 var(--space-2);
  border-radius: 8px;
  background: var(--color-surface);

  & + & {
    margin-top: var(--space-1);
  }
}

.pool-item {
  border: 1px solid var(--color-border);
  cursor: grab;
  touch-action: pan-y;

  &.mine {
    border-color: var(--color-primary);
  }

  &.is-used-up {
    opacity: 0.45;
    cursor: default;
  }
}

.gear-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.owner {
  margin-left: var(--space-1);
  color: var(--color-text-muted);
  font-size: 12px;
}

.qty {
  color: var(--color-text-muted);
  font-size: 13px;
}

.round {
  flex: none;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.stepper {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  span {
    min-width: 20px;
    text-align: center;
    font-weight: 600;
  }
}

.drop-zone {
  min-height: 160px;
  padding: var(--space-2);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);

  &.empty {
    display: grid;
    place-items: center;
  }

  // 끌어다 놓는 중 생기는 미리보기 항목은 숨기고, store가 반영한 목록만 보여준다.
  :deep(> .gear-item) {
    display: none;
  }
}

.hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}
</style>
