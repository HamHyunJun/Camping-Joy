<template>
  <section>
    <div class="page-head">
      <h1 class="page-title">장비 배분</h1>
      <button v-if="shared.length" class="btn btn-text btn-danger" type="button" @click="reset">초기화</button>
    </div>
    <p class="page-desc">멤버들이 가진 장비를 '공통으로 챙길 장비'로 끌어다 놓거나 + 를 눌러 주세요. 장비는 주인이 챙기고, 멤버별 개수는 멤버 목록에 표시돼요.</p>

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
        <div ref="dropZone" class="drop-zone" :class="{ empty: !shared.length }">
          <template v-if="shared.length">
            <div v-for="group in sharedGroups" :key="group.category" class="group">
              <h3 class="group-label">{{ group.label }}</h3>
              <ul class="gear-list">
                <li v-for="item in group.items" :key="`${holderOf(item)?.id}:${item.id}`" class="gear-item">
                  <span class="gear-name">
                    {{ equipmentLabel.equipmentLabel(item) }}
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
          <p v-else class="hint">멤버들이 가진 장비를 여기로 끌어 놓거나 + 를 눌러 주세요.</p>

          <!-- 드래그 중에만 보이는 덮개. 여기에 놓으면 추가된다.
               + 표시와 문구는 항목이 아니라고 알려야(draggable) 덮개 어디에 놓아도 빈 목록처럼 받아 준다. -->
          <VueDraggable
            v-show="dragging"
            :model-value="[]"
            class="drop-overlay"
            :class="{ over: overDropZone }"
            draggable=".gear-item"
            :group="{ name: dragGroup, pull: false, put: true }"
            :sort="false"
            @update:model-value="onDrop"
          >
            <span class="drop-plus" aria-hidden="true">+</span>
            <span class="drop-text">놓으면 추가돼요</span>
          </VueDraggable>
        </div>
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
            :force-fallback="true"
            :fallback-tolerance="3"
            @start="onDragStart"
            @end="onDragEnd"
            @update:model-value="ignore"
          >
            <li
              v-for="item in group.items"
              :key="item.id"
              class="gear-item pool-item"
              :class="{ 'is-used-up': remaining(item) < 1 }"
            >
              <span class="gear-name">
                {{ equipmentLabel.equipmentLabel(item) }}
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
      <NuxtLink v-if="shared.length" class="btn btn-primary" :to="`/camps/${route.params.campId}/schedule`">
        다음: 일정 짜기
      </NuxtLink>
      <button v-else class="btn btn-primary" type="button" disabled>다음: 일정 짜기</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { Equipment, ID, Member } from '~/types/camp'
import equipmentLabel from '~/utils/equipmentLabel'
import groupByCategory from '~/utils/groupByCategory'

definePageMeta({ wide: true })

const store = useCampStore()
const gear = useGearStore()
const route = useRoute()

const dragGroup = 'distribute'
const pointerEvents = ['dragover', 'mousemove', 'touchmove'] as const
// 드래그 중에는 공통 목록 위에 덮개를 띄워 거기에 놓게 한다.
// 목록 안에 바로 끼워 넣으면 SortableJS가 자리를 계산하며 항목들이 위아래로 흔들린다.
const dropZone = ref<HTMLElement>()
const dragging = ref(false)
const overDropZone = ref(false)

onBeforeUnmount(() => onDragEnd())

const members = computed(() => store.currentCamp?.members ?? [])
/** 이번 캠핑 멤버들이 등록해 둔 장비 전체 */
const pool = computed<Equipment[]>(() => members.value.flatMap((m) => gear.findPerson(m.id)?.equipments ?? []))
const poolGroups = computed(() => groupByCategory.groupByCategory(pool.value))
/** 공통으로 챙길 장비: 모든 멤버의 담당 장비를 한 목록으로 모은다. 장비는 주인이 챙긴다. */
const shared = computed<Equipment[]>(() => members.value.flatMap((m) => m.equipments))
const sharedGroups = computed(() => groupByCategory.groupByCategory(shared.value))

const ownerName = (ownerId: ID): string =>
  members.value.find((m) => m.id === ownerId)?.name ?? gear.findPerson(ownerId)?.name ?? ''

/** 공통 목록의 항목을 실제로 들고 있는 멤버 */
const holderOf = (item: Equipment): Member | undefined => members.value.find((m) => m.equipments.includes(item))

const remaining = (owned: Equipment): number => owned.quantity - store.assignedQuantity(owned.id)

const ownedOf = (equipmentId: ID): Equipment | undefined => pool.value.find((e) => e.id === equipmentId)

const add = (owned: Equipment): void => {
  store.addMemberEquipment(owned.ownerId, owned)
}

const addAgain = (item: Equipment): void => {
  const owned = ownedOf(item.id)
  if (owned) add(owned)
}

const subtract = (item: Equipment): void => {
  const holder = holderOf(item)
  if (holder) store.removeMemberEquipment(holder.id, item.id)
}

const trackPointer = (event: DragEvent | MouseEvent | TouchEvent): void => {
  const point = 'touches' in event ? event.touches[0] : event
  // 모바일에서는 덮개가 화면 위쪽에 고정되므로 덮개 자체의 위치로 판단한다.
  const rect = dropZone.value?.querySelector('.drop-overlay')?.getBoundingClientRect()
  if (!point || !rect) return
  overDropZone.value =
    point.clientX >= rect.left && point.clientX <= rect.right && point.clientY >= rect.top && point.clientY <= rect.bottom
}

const onDragStart = (): void => {
  dragging.value = true
  overDropZone.value = false
  for (const type of pointerEvents) document.addEventListener(type, trackPointer, { capture: true, passive: true })
}

const onDragEnd = (): void => {
  for (const type of pointerEvents) document.removeEventListener(type, trackPointer, { capture: true })
  dragging.value = false
  overDropZone.value = false
}

/** 보유 장비를 덮개에 놓았을 때. 덮개 안에서 손을 뗐을 때만 추가한다. */
const onDrop = (list: Equipment[]): void => {
  const dropped = list.find((item) => pool.value.includes(item))
  if (dropped && overDropZone.value) add(dropped)
}

const assignedCount = (memberId: ID): number => {
  const member = members.value.find((m) => m.id === memberId)
  return member?.equipments.reduce((sum, e) => sum + e.quantity, 0) ?? 0
}

const keepItem = (item: Equipment): Equipment => item
const ignore = (): void => {}

const reset = (): void => {
  if (!confirm('공통으로 챙길 장비를 모두 비울까요?')) return
  store.resetDistribution()
}
</script>

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
  // 텐트처럼 이름이 길어도 주인 이름이 잘리지 않게 줄을 바꾼다.
  line-height: 1.35;
  word-break: keep-all;
  overflow-wrap: anywhere;
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
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 15px;
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
  gap: 6px;

  span {
    min-width: 18px;
    text-align: center;
    font-weight: 600;
  }
}

.drop-zone {
  position: relative;
  min-height: 160px;
  padding: var(--space-2);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);

  &.empty {
    display: grid;
    place-items: center;
  }

}

.drop-overlay {
  position: absolute;
  inset: -2px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius);
  background: rgb(243 245 241 / 55%);
  backdrop-filter: blur(3px);
  transition:
    background-color 0.15s,
    border-color 0.15s;

  // 모바일은 보유 장비가 공통 목록 아래에 쌓여 있어, 끌기 시작하면 공통 목록이 화면 밖일 수 있다.
  // 그래서 덮개를 헤더 바로 아래에 고정해 언제든 놓을 수 있게 한다.
  @include mobile {
    position: fixed;
    top: calc(var(--header-height) + var(--safe-top) + 56px);
    right: var(--space-4);
    left: var(--space-4);
    bottom: auto;
    z-index: 25;
    height: 160px;
    box-shadow: var(--shadow-md);
  }

  // 끌어다 놓는 중 덮개에 들어온 미리보기 항목은 숨긴다.
  :deep(> .gear-item) {
    display: none;
  }

  &.over {
    border-color: var(--color-primary);
    background: rgb(230 240 234 / 75%);

    .drop-plus {
      transform: scale(1.15);
      background: var(--color-primary);
      color: #fff;
    }

    .drop-text {
      color: var(--color-primary);
    }
  }
}

.drop-plus {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: 32px;
  line-height: 1;
  pointer-events: none;
  transition:
    transform 0.15s,
    background-color 0.15s,
    color 0.15s;
}

.drop-text {
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 600;
  pointer-events: none;
}

.hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}
</style>
