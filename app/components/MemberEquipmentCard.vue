<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import type { Equipment, Member } from '~/types/camp'

const props = defineProps<{ member: Member }>()
const store = useCampStore()
const gear = useGearStore()

const person = computed(() => gear.findPerson(props.member.id))
const ownedGroups = computed(() => groupByCategory(person.value?.equipments ?? []))
const bringingGroups = computed(() => groupByCategory(props.member.equipments))
const dragGroup = computed(() => `gear-${props.member.id}`)

function bringingQuantity(equipmentId: string): number {
  return props.member.equipments.find((e) => e.id === equipmentId)?.quantity ?? 0
}

function remaining(owned: Equipment): number {
  return owned.quantity - bringingQuantity(owned.id)
}

function ownedQuantity(equipmentId: string): number {
  return person.value?.equipments.find((e) => e.id === equipmentId)?.quantity ?? 0
}

function add(owned: Equipment) {
  store.addMemberEquipment(props.member.id, owned)
}

/** 보유 장비를 가져갈 장비 영역에 놓았을 때. 새로 들어온 항목만 찾아 store로 넘긴다. */
function onDrop(list: Equipment[]) {
  const dropped = list.find((item) => !props.member.equipments.includes(item))
  if (dropped) add(dropped)
}

function addAgain(item: Equipment) {
  const owned = person.value?.equipments.find((e) => e.id === item.id)
  if (owned) add(owned)
}

const keepItem = (item: Equipment) => item
const ignore = () => {}
</script>

<template>
  <article class="card member-card">
    <header class="member-header">
      <span class="avatar">{{ member.name.slice(0, 1) }}</span>
      <strong>{{ member.name }}</strong>
    </header>

    <div class="columns">
      <section class="column">
        <h3 class="column-title">보유 장비</h3>
        <p v-if="!person" class="hint">장비 등록에서 삭제된 사람이에요.</p>
        <p v-else-if="!ownedGroups.length" class="hint">
          등록된 장비가 없어요. <NuxtLink to="/gear">장비 등록</NuxtLink>에서 추가해 주세요.
        </p>
        <div v-for="group in ownedGroups" :key="group.category" class="group">
          <h4 class="group-label">{{ group.label }}</h4>
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
              class="gear-item owned"
              :class="{ 'is-used-up': remaining(item) < 1 }"
            >
              <span class="gear-name">{{ item.name }}</span>
              <span class="qty">남은 {{ remaining(item) }}</span>
              <button type="button" class="round" :disabled="remaining(item) < 1" aria-label="넣기" @click="add(item)">
                +
              </button>
            </li>
          </VueDraggable>
        </div>
      </section>

      <section class="column">
        <h3 class="column-title">이번 캠핑에 가져갈 장비</h3>
        <VueDraggable
          :model-value="member.equipments"
          class="drop-zone"
          :class="{ empty: !member.equipments.length }"
          :group="{ name: dragGroup, pull: false, put: true }"
          :sort="false"
          @update:model-value="onDrop"
        >
          <template v-if="member.equipments.length">
            <div v-for="group in bringingGroups" :key="group.category" class="group">
              <h4 class="group-label">{{ group.label }}</h4>
              <ul class="gear-list">
                <li v-for="item in group.items" :key="item.id" class="gear-item">
                  <span class="gear-name">{{ item.name }}</span>
                  <div class="stepper">
                    <button type="button" class="round" aria-label="하나 빼기" @click="store.removeMemberEquipment(member.id, item.id)">
                      −
                    </button>
                    <span>{{ item.quantity }}</span>
                    <button
                      type="button"
                      class="round"
                      aria-label="하나 더 넣기"
                      :disabled="item.quantity >= ownedQuantity(item.id)"
                      @click="addAgain(item)"
                    >
                      +
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </template>
          <p v-else class="hint drop-hint">보유 장비를 여기로 끌어 놓거나 + 를 눌러 넣어 주세요.</p>
        </VueDraggable>
      </section>
    </div>
  </article>
</template>

<style scoped lang="scss">
.member-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.member-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.avatar {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 14px;
}

.columns {
  display: grid;
  gap: var(--space-4);

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
}

.column-title {
  margin: 0 0 var(--space-2);
  font-size: 15px;
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

  &.owned {
    border: 1px solid var(--color-border);
    cursor: grab;
    touch-action: pan-y;
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
  min-height: 120px;
  padding: var(--space-2);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius);
  background: var(--color-bg);

  &.empty {
    display: grid;
    place-items: center;
  }

  // 끌어다 놓는 중 보이는 미리보기 항목은 숨기고, store가 반영한 목록만 보여준다.
  :deep(> .gear-item) {
    display: none;
  }
}

.hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.drop-hint {
  text-align: center;
}
</style>
