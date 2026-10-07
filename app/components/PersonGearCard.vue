<script setup lang="ts">
import type { EquipmentCategory, Person } from '~/types/camp'
import { EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_PRESETS, type EquipmentPreset } from '~/constants/equipment'

const props = defineProps<{ person: Person; initiallyOpen?: boolean }>()
const gear = useGearStore()

const groups = computed(() => groupByCategory(props.person.equipments))
const categoryOptions = Object.entries(EQUIPMENT_CATEGORY_LABELS) as [EquipmentCategory, string][]

const open = ref(props.initiallyOpen ?? false)
const totalCount = computed(() => props.person.equipments.reduce((sum, e) => sum + e.quantity, 0))

const editingName = ref<string | null>(null)
const form = reactive<{ name: string; category: EquipmentCategory; quantity: number }>({
  name: '',
  category: 'etc',
  quantity: 1,
})

/** 크기를 골라야 하는 장비를 눌렀을 때 크기 선택을 연다. */
const sizingPreset = ref<EquipmentPreset | null>(null)
const sizingGuide = computed(() => (sizingPreset.value ? sizeGuideOf(sizingPreset.value.name) : undefined))

function addPreset(preset: EquipmentPreset) {
  if (sizeGuideOf(preset.name)) {
    sizingPreset.value = sizingPreset.value?.name === preset.name ? null : preset
    return
  }
  gear.addEquipment(props.person.id, { ...preset, quantity: 1 })
}

function addWithSize(size: string) {
  if (!sizingPreset.value) return
  gear.addEquipment(props.person.id, { ...sizingPreset.value, quantity: 1, size })
  sizingPreset.value = null
}

function addCustom() {
  if (!form.name.trim()) return
  gear.addEquipment(props.person.id, { ...form, quantity: Math.max(1, form.quantity) })
  form.name = ''
  form.quantity = 1
}

function saveName() {
  if (editingName.value !== null) gear.renamePerson(props.person.id, editingName.value)
  editingName.value = null
}

function removePerson() {
  if (!confirm(`${props.person.name}님과 등록된 장비를 모두 삭제할까요?`)) return
  gear.removePerson(props.person.id)
}
</script>

<template>
  <article class="card person-card">
    <header class="person-header">
      <button type="button" class="toggle" :aria-expanded="open" @click="open = !open">
        <span class="avatar">{{ person.name.slice(0, 1) }}</span>
        <span class="title">
          <strong class="name">{{ person.name }}</strong>
          <span class="summary">장비 {{ totalCount }}개</span>
        </span>
        <span class="chevron" :class="{ open }" aria-hidden="true" />
        <span class="sr-only">{{ open ? '숨기기' : '더보기' }}</span>
      </button>
    </header>

    <div v-if="open" class="details">
      <div class="person-actions">
        <form v-if="editingName !== null" class="name-form" @submit.prevent="saveName">
          <input v-model="editingName" class="input" type="text" maxlength="20" />
          <button class="btn" type="submit">저장</button>
        </form>
        <template v-else>
          <button class="btn btn-text" type="button" @click="editingName = person.name">이름 수정</button>
          <button class="btn btn-text btn-danger" type="button" @click="removePerson">삭제</button>
        </template>
      </div>

      <div v-for="group in groups" :key="group.category" class="group">
        <h3 class="group-label">{{ group.label }}</h3>
        <ul class="gear-list">
          <li v-for="item in group.items" :key="item.id" class="gear-item">
            <span class="gear-name">
              {{ item.name }}
              <select
                v-if="sizeGuideOf(item.name)"
                class="size-select"
                :value="item.size ?? ''"
                aria-label="크기"
                @change="gear.setEquipmentSize(person.id, item.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="" disabled>크기 선택</option>
                <option v-for="option in sizeGuideOf(item.name)!.options" :key="option.label" :value="option.label">
                  {{ option.label }}
                </option>
              </select>
              <SizeGuideTooltip v-if="sizeGuideOf(item.name)" :guide="sizeGuideOf(item.name)!" />
            </span>
            <div class="stepper">
              <button type="button" aria-label="하나 빼기" @click="gear.setEquipmentQuantity(person.id, item.id, item.quantity - 1)">−</button>
              <span>{{ item.quantity }}</span>
              <button type="button" aria-label="하나 더하기" @click="gear.setEquipmentQuantity(person.id, item.id, item.quantity + 1)">+</button>
            </div>
          </li>
        </ul>
      </div>
      <p v-if="!groups.length" class="empty">아래에서 가진 장비를 골라 주세요.</p>

      <div class="presets">
        <button
          v-for="preset in EQUIPMENT_PRESETS"
          :key="preset.name"
          class="chip"
          :class="{ active: sizingPreset?.name === preset.name }"
          type="button"
          @click="addPreset(preset)"
        >
          + {{ preset.name }}
        </button>
      </div>

      <div v-if="sizingPreset && sizingGuide" class="size-picker">
        <div class="size-picker-title">
          {{ sizingPreset.name }} 크기를 골라 주세요
          <SizeGuideTooltip :guide="sizingGuide" />
        </div>
        <div class="size-options">
          <button v-for="option in sizingGuide.options" :key="option.label" class="chip" type="button" @click="addWithSize(option.label)">
            {{ option.label }}
          </button>
        </div>
      </div>

      <form class="custom-form" @submit.prevent="addCustom">
        <input v-model="form.name" class="input" type="text" placeholder="직접 입력" maxlength="30" />
        <select v-model="form.category" class="input" aria-label="카테고리">
          <option v-for="[value, label] in categoryOptions" :key="value" :value="value">{{ label }}</option>
        </select>
        <button class="btn" type="submit" :disabled="!form.name.trim()">추가</button>
      </form>
    </div>
  </article>
</template>

<style scoped lang="scss">
.person-card {
  padding: 0;
}

.toggle {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.title {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.name {
  overflow: hidden;
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary {
  color: var(--color-text-muted);
  font-size: 13px;
}

.chevron {
  width: 10px;
  height: 10px;
  border-right: 2px solid var(--color-text-muted);
  border-bottom: 2px solid var(--color-text-muted);
  transform: translateY(-3px) rotate(45deg);
  transition: transform 0.15s;

  &.open {
    transform: translateY(3px) rotate(-135deg);
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.details {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0 var(--space-4) var(--space-4);
  border-top: 1px solid var(--color-border);
}

.person-actions,
.name-form {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
  padding-top: var(--space-2);
}

.name-form {
  flex: 1;
  padding-top: 0;
}

.avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 14px;
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
  justify-content: space-between;
  min-height: 44px;

  & + & {
    border-top: 1px solid var(--color-border);
  }
}

.stepper {
  display: flex;
  align-items: center;
  gap: var(--space-2);

  button {
    width: 32px;
    height: 32px;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-text);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
  }

  span {
    min-width: 20px;
    text-align: center;
    font-weight: 600;
  }
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-bg);
  color: var(--color-text);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.gear-name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-1);
}

.chip.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.size-picker {
  padding: var(--space-3);
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  background: var(--color-primary-soft);
}

.size-picker-title {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin-bottom: var(--space-2);
  font-size: 14px;
  font-weight: 600;
}

.size-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);

  .chip {
    background: var(--color-surface);
  }
}

.size-select {
  margin-left: var(--space-1);
  padding: 2px 4px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 13px;
}

.custom-form {
  display: grid;
  grid-template-columns: 1fr 110px auto;
  gap: var(--space-2);
}

.empty {
  padding: var(--space-2) 0;
}
</style>
