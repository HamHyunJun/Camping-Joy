<template>
  <article class="card person-card">
    <header class="person-header">
      <button type="button" class="toggle" :aria-expanded="open" @click="open = !open">
        <span class="avatar">{{ person.name.slice(0, 1) }}</span>
        <span class="title">
          <strong class="name">{{ person.name }}</strong>
          <span class="summary">
            장비 {{ totalCount }}개<template v-if="!open && categorySummary"> · {{ categorySummary }}</template>
          </span>
        </span>
        <span class="chevron" :class="{ open }" aria-hidden="true" />
        <span class="sr-only">{{ open ? '숨기기' : '더보기' }}</span>
      </button>
    </header>

    <div v-if="open" class="details">
      <div class="person-actions">
        <form v-if="editingName !== undefined" class="name-form" @submit.prevent="saveName">
          <input v-model="editingName" class="input" type="text" maxlength="20" />
          <button class="btn" type="submit">저장</button>
        </form>
        <template v-else>
          <button class="btn btn-text" type="button" @click="editingName = person.name">이름 수정</button>
          <button class="btn btn-text btn-danger" type="button" @click="removePerson">삭제</button>
        </template>
      </div>

      <div v-if="groups.length" class="groups">
        <section v-for="group in groups" :key="group.category" class="group">
          <h3 class="group-label">
            {{ group.label }}
            <span class="group-count">{{ group.items.reduce((sum, e) => sum + e.quantity, 0) }}</span>
          </h3>
          <ul class="gear-list">
            <li v-for="item in group.items" :key="item.id" class="gear-item">
              <span class="gear-name">
                {{ item.name }}
                <SelectMenu
                  v-if="equipmentLabel.sizeGuideOf(item.name)"
                  class="size-select"
                  size="sm"
                  :model-value="item.size"
                  :options="sizeOptions(item.name)"
                  placeholder="크기 선택"
                  aria-label="크기"
                  @update:model-value="gear.setEquipmentSize(person.id, item.id, $event)"
                />
              </span>
              <div class="stepper">
                <button type="button" aria-label="하나 빼기" @click="decrease(item)">−</button>
                <span>{{ item.quantity }}</span>
                <button type="button" aria-label="하나 더하기" @click="gear.setEquipmentQuantity(person.id, item.id, item.quantity + 1)">+</button>
              </div>
              <input
                v-if="equipmentLabel.hasModelName(item.name)"
                class="input model-input"
                type="text"
                maxlength="30"
                :value="item.model ?? ''"
                placeholder="텐트명 (예: 코베아 고스트)"
                aria-label="텐트명"
                @change="gear.setEquipmentModel(person.id, item.id, ($event.target as HTMLInputElement).value)"
              />
            </li>
          </ul>
        </section>
      </div>
      <p v-else class="empty">아래에서 가진 장비를 골라 주세요.</p>

      <div ref="adder" class="adder">
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
          <!-- 툴팁이 크기 칩을 가리지 않도록, 여기서는 기준을 칩에 바로 적는다. -->
          <input
            v-if="equipmentLabel.hasModelName(sizingPreset.name)"
            v-model="sizingModel"
            class="input model-input"
            type="text"
            maxlength="30"
            :placeholder="`${sizingPreset.name}명 (선택, 예: 코베아 고스트)`"
            :aria-label="`${sizingPreset.name}명`"
          />
          <p class="size-picker-title">{{ sizingPreset.name }} 크기를 골라 주세요</p>
          <div class="size-options">
            <button v-for="option in sizingGuide.options" :key="option.label" class="chip" type="button" @click="addWithSize(option.label)">
              {{ option.label }}<small v-if="option.description">{{ option.description }}</small>
            </button>
          </div>
        </div>

        <form class="custom-form" @submit.prevent="addCustom">
          <input v-model="form.name" class="input" type="text" placeholder="직접 입력" maxlength="30" />
          <SelectMenu
            :model-value="form.category"
            :options="categoryOptions"
            aria-label="카테고리"
            @update:model-value="form.category = $event as EquipmentCategory"
          />
          <button class="btn" type="submit" :disabled="!form.name.trim()">추가</button>
        </form>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Equipment, EquipmentCategory, Person } from '~/types/camp'
import type { SelectMenuOption } from '~/components/SelectMenu.vue'
import { EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_PRESETS, type EquipmentPreset } from '~/constants/equipment'
import equipmentLabel from '~/utils/equipmentLabel'
import groupByCategory from '~/utils/groupByCategory'

const props = defineProps<{ person: Person; initiallyOpen?: boolean }>()

const gear = useGearStore()

const categoryOptions: SelectMenuOption[] = Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))

const open = ref(props.initiallyOpen ?? false)
const adder = ref<HTMLElement>()
const editingName = ref<string>()
const form = reactive<{ name: string; category: EquipmentCategory; quantity: number }>({
  name: '',
  category: 'etc',
  quantity: 1,
})
/** 크기를 골라야 하는 장비를 눌렀을 때 크기 선택을 연다. */
const sizingPreset = ref<EquipmentPreset>()
/** 텐트처럼 이름을 적을 수 있는 장비를 추가할 때 함께 적는 이름 */
const sizingModel = ref('')

const groups = computed(() => groupByCategory.groupByCategory(props.person.equipments))
const totalCount = computed(() => props.person.equipments.reduce((sum, e) => sum + e.quantity, 0))
/** 접힌 상태에서 보여줄 카테고리별 개수 */
const categorySummary = computed(() =>
  groups.value.map((group) => `${group.label} ${group.items.reduce((sum, e) => sum + e.quantity, 0)}`).join(' · '),
)
const sizingGuide = computed(() => (sizingPreset.value ? equipmentLabel.sizeGuideOf(sizingPreset.value.name) : undefined))

const sizeOptions = (name: string): SelectMenuOption[] =>
  (equipmentLabel.sizeGuideOf(name)?.options ?? []).map((o) => ({ value: o.label, label: o.label, hint: o.description }))

/** 장비가 쌓여 입력부가 밀려도, 추가 직후 입력부가 화면에 계속 보이게 따라간다. */
const keepAdderInView = async (): Promise<void> => {
  await nextTick()
  adder.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

const addPreset = (preset: EquipmentPreset): void => {
  if (equipmentLabel.sizeGuideOf(preset.name)) {
    sizingPreset.value = sizingPreset.value?.name === preset.name ? undefined : preset
    sizingModel.value = ''
    return
  }
  gear.addEquipment(props.person.id, { ...preset, quantity: 1 })
  keepAdderInView()
}

const addWithSize = (size: string): void => {
  if (!sizingPreset.value) return
  gear.addEquipment(props.person.id, { ...sizingPreset.value, quantity: 1, size, model: sizingModel.value })
  sizingPreset.value = undefined
  sizingModel.value = ''
  keepAdderInView()
}

const addCustom = (): void => {
  if (!form.name.trim()) return
  gear.addEquipment(props.person.id, { ...form, quantity: Math.max(1, form.quantity) })
  form.name = ''
  form.quantity = 1
  keepAdderInView()
}

const decrease = (item: Equipment): void => {
  if (item.quantity <= 1 && !confirm(`${equipmentLabel.equipmentLabel(item)}을(를) 목록에서 삭제할까요?`)) return
  gear.setEquipmentQuantity(props.person.id, item.id, item.quantity - 1)
}

const saveName = (): void => {
  if (editingName.value !== undefined) gear.renamePerson(props.person.id, editingName.value)
  editingName.value = undefined
}

const removePerson = (): void => {
  const campCount = useCampStore().countCampsWithPerson(props.person.id)
  const extra = campCount ? `\n멤버로 들어간 캠핑 ${campCount}곳에서도 빠지고, 챙길 장비도 함께 빠져요.` : ''
  if (!confirm(`${props.person.name}님과 등록된 장비를 모두 삭제할까요?${extra}`)) return
  gear.removePerson(props.person.id)
}

// 다른 사람을 새로 추가하면 앞사람 카드는 접는다.
watch(
  () => props.initiallyOpen,
  (value) => (open.value = value ?? false),
)
</script>

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
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  gap: var(--space-4);
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
  width: 40px;
  height: 40px;
}

.groups {
  display: grid;
  gap: var(--space-3);
}

.group {
  padding: var(--space-3) var(--space-2) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
}

.group-label {
  display: flex;
  padding: 0 var(--space-1);
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-2);
  color: var(--color-primary);
  font-size: 15px;
  font-weight: 700;
}

.group-count {
  padding: 0 8px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  font-size: 12px;
  line-height: 20px;
}

.gear-list {
  display: grid;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.gear-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  min-height: 48px;
  padding: var(--space-1) var(--space-2) var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.stepper {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--space-2);

  button {
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

    &:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }

  span {
    min-width: 20px;
    text-align: center;
    font-weight: 600;
  }
}

.adder {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  // 스크롤해 따라갈 때 화면 바닥에 딱 붙지 않게 여유를 둔다.
  scroll-margin-bottom: 120px;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  background: var(--color-surface-muted);
}

.gear-name {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  min-width: 0;
  white-space: nowrap;
}

.chip.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.size-picker {
  padding: var(--space-3);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
}

.model-input {
  flex-basis: 100%;
  margin-bottom: var(--space-2);
  font-size: 14px;
}

.gear-item .model-input {
  min-height: 38px;
  margin: 0 0 var(--space-1);
}

.size-picker-title {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin: 0 0 var(--space-2);
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
