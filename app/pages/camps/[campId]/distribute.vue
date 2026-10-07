<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { Equipment, ID, Member } from '~/types/camp'

definePageMeta({ wide: true })

const store = useCampStore()
const gear = useGearStore()
const route = useRoute()

const members = computed(() => store.currentCamp?.members ?? [])

/** 이번 캠핑 멤버들이 등록해 둔 장비 전체 */
const pool = computed<Equipment[]>(() => members.value.flatMap((m) => gear.findPerson(m.id)?.equipments ?? []))
const poolGroups = computed(() => groupByCategory(pool.value))

/** 공통으로 챙길 장비: 모든 멤버의 담당 장비를 한 목록으로 모은다. 장비는 주인이 챙긴다. */
const shared = computed<Equipment[]>(() => members.value.flatMap((m) => m.equipments))
const sharedGroups = computed(() => groupByCategory(shared.value))

const dragGroup = 'distribute'

function ownerName(ownerId: ID): string {
  return members.value.find((m) => m.id === ownerId)?.name ?? gear.findPerson(ownerId)?.name ?? ''
}

/** 공통 목록의 항목을 실제로 들고 있는 멤버 */
function holderOf(item: Equipment): Member | undefined {
  return members.value.find((m) => m.equipments.includes(item))
}

function remaining(owned: Equipment): number {
  return owned.quantity - store.assignedQuantity(owned.id)
}

function ownedOf(equipmentId: ID): Equipment | undefined {
  return pool.value.find((e) => e.id === equipmentId)
}

function add(owned: Equipment) {
  store.addMemberEquipment(owned.ownerId, owned)
}

function addAgain(item: Equipment) {
  const owned = ownedOf(item.id)
  if (owned) add(owned)
}

function subtract(item: Equipment) {
  const holder = holderOf(item)
  if (holder) store.removeMemberEquipment(holder.id, item.id)
}

/** 보유 장비를 공통 목록에 놓았을 때. 보유 장비에서 온 항목을 찾아 추가한다. */
function onDrop(list: Equipment[]) {
  const dropped = list.find((item) => pool.value.includes(item))
  if (dropped) add(dropped)
}

function assignedCount(memberId: ID): number {
  const member = members.value.find((m) => m.id === memberId)
  return member?.equipments.reduce((sum, e) => sum + e.quantity, 0) ?? 0
}

const keepItem = (item: Equipment) => item
const ignore = () => {}

function reset() {
  if (!confirm('공통으로 챙길 장비를 모두 비울까요?')) return
  store.resetDistribution()
}
</script>

<template>
  <section>
    <div class="page-head">
      <h1 class="page-title">장비 배분</h1>
      <button v-if="shared.length" class="btn btn-text btn-danger" type="button" @click="reset">초기화</button>
    </div>
    <p class="page-desc">오른쪽에서 이번 캠핑에 챙길 장비를 끌어다 놓거나 + 를 눌러 주세요. 장비는 주인이 챙기고, 멤버별 개수는 왼쪽에 표시돼요.</p>

    <p v-if="!members.length" class="empty">먼저 멤버를 추가해 주세요.</p>

    <div v-else class="board">
      <!-- 멤버 -->
      <nav class="panel members-panel" aria-label="멤버">
        <h2 class="panel-title">멤버</h2>
        <ul class="member-list">
          <li v-for="member in members" :key="member.id" class="member-row">
            <span class="name">{{ member.name }}</span>
            <span class="badge" :class="{ zero: !assignedCount(member.id) }">{{ assignedCount(member.id) }}</span>
          </li>
        </ul>
      </nav>

      <!-- 공통으로 챙길 장비 -->
      <section class="panel">
        <h2 class="panel-title">공통으로 챙길 장비</h2>
        <VueDraggable
          :model-value="shared"
          class="drop-zone"
          :class="{ empty: !shared.length }"
          :group="{ name: dragGroup, pull: false, put: true }"
          :sort="false"
          @update:model-value="onDrop"
        >
          <template v-if="shared.length">
            <div v-for="group in sharedGroups" :key="group.category" class="group">
              <h3 class="group-label">{{ group.label }}</h3>
              <ul class="gear-list">
                <li v-for="item in group.items" :key="`${holderOf(item)?.id}:${item.id}`" class="gear-item">
                  <span class="gear-name">
                    {{ equipmentLabel(item) }}
                    <small class="owner">{{ holderOf(item)?.name }}</small>
                  </span>
                  <div class="stepper">
                    <button type="button" class="round" aria-label="하나 빼기" @click="subtract(item)">−</button>
                    <span>{{ item.quantity }}</span>
                    <button
                      type="button"
                      class="round"
                      aria-label="하나 더"
                      :disabled="!ownedOf(item.id) || remaining(ownedOf(item.id)!) < 1"
                      @click="addAgain(item)"
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
              :class="{ 'is-used-up': remaining(item) < 1 }"
            >
              <span class="gear-name">
                {{ equipmentLabel(item) }}
                <small class="owner">{{ ownerName(item.ownerId) }}</small>
              </span>
              <span class="qty">남은 {{ remaining(item) }}</span>
              <button
                type="button"
                class="round"
                :disabled="remaining(item) < 1"
                aria-label="추가"
                @click="add(item)"
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
      <NuxtLink v-if="shared.length" class="btn btn-primary" :to="`/camps/${route.params.campId}/result`">
        다음: 결과 보기
      </NuxtLink>
      <button v-else class="btn btn-primary" type="button" disabled>다음: 결과 보기</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.board {
  display: grid;
  gap: var(--space-3);

  @include pc {
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

  @include pc {
    flex-direction: column;
    overflow: visible;
  }
}

.member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  min-height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  white-space: nowrap;

  @include pc {
    border-radius: 8px;
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

  &.zero {
    background: var(--color-border);
    color: var(--color-text-muted);
  }
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
