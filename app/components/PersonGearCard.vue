<script setup lang="ts">
import type { EquipmentCategory, Person } from '~/types/camp'
import { EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_PRESETS, type EquipmentPreset } from '~/constants/equipment'

const props = defineProps<{ person: Person }>()
const gear = useGearStore()

const groups = computed(() => groupByCategory(props.person.equipments))
const categoryOptions = Object.entries(EQUIPMENT_CATEGORY_LABELS) as [EquipmentCategory, string][]

const editingName = ref<string | null>(null)
const form = reactive<{ name: string; category: EquipmentCategory; quantity: number }>({
  name: '',
  category: 'etc',
  quantity: 1,
})

function addPreset(preset: EquipmentPreset) {
  gear.addEquipment(props.person.id, { ...preset, quantity: 1 })
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
      <form v-if="editingName !== null" class="name-form" @submit.prevent="saveName">
        <input v-model="editingName" class="input" type="text" maxlength="20" />
        <button class="btn" type="submit">저장</button>
      </form>
      <template v-else>
        <span class="avatar">{{ person.name.slice(0, 1) }}</span>
        <strong class="name">{{ person.name }}</strong>
        <button class="btn btn-text" type="button" @click="editingName = person.name">이름 수정</button>
        <button class="btn btn-text btn-danger" type="button" @click="removePerson">삭제</button>
      </template>
    </header>

    <div v-for="group in groups" :key="group.category" class="group">
      <h3 class="group-label">{{ group.label }}</h3>
      <ul class="gear-list">
        <li v-for="item in group.items" :key="item.id" class="gear-item">
          <span class="gear-name">{{ item.name }}</span>
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
        type="button"
        @click="addPreset(preset)"
      >
        + {{ preset.name }}
      </button>
    </div>

    <form class="custom-form" @submit.prevent="addCustom">
      <input v-model="form.name" class="input" type="text" placeholder="직접 입력" maxlength="30" />
      <select v-model="form.category" class="input" aria-label="카테고리">
        <option v-for="[value, label] in categoryOptions" :key="value" :value="value">{{ label }}</option>
      </select>
      <button class="btn" type="submit" :disabled="!form.name.trim()">추가</button>
    </form>
  </article>
</template>

<style scoped lang="scss">
.person-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.person-header,
.name-form {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.name-form {
  flex: 1;
}

.avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 14px;
}

.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.custom-form {
  display: grid;
  grid-template-columns: 1fr 110px auto;
  gap: var(--space-2);
}

.empty {
  padding: var(--space-2) 0;
}
</style>
