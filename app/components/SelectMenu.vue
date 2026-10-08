<template>
  <div ref="root" class="select-menu" :class="[size, { open }]" @keydown.esc="open = false">
    <button
      type="button"
      class="select-trigger"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-label="ariaLabel"
      @click="toggle"
    >
      <span class="select-value" :class="{ placeholder: !selected }">{{ selected?.label ?? placeholder }}</span>
      <span class="select-chevron" aria-hidden="true">›</span>
    </button>
    <ul v-if="open" class="select-options" :class="{ up: dropUp }" role="listbox" :aria-label="ariaLabel">
      <li v-for="option in options" :key="option.value">
        <button
          type="button"
          role="option"
          class="select-option"
          :class="{ selected: option.value === modelValue }"
          :aria-selected="option.value === modelValue"
          @click="choose(option.value)"
        >
          <span class="option-text">
            {{ option.label }}
            <small v-if="option.hint">{{ option.hint }}</small>
          </span>
          <span v-if="option.value === modelValue" class="option-check" aria-hidden="true">✓</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
export interface SelectMenuOption {
  value: string
  label: string
  /** 옵션 아래 작은 설명 (예: '20L 미만') */
  hint?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string | null
    options: SelectMenuOption[]
    placeholder?: string
    ariaLabel?: string
    /** sm: 목록 줄 안에 들어가는 작은 크기 */
    size?: 'sm' | 'md'
  }>(),
  { placeholder: '선택', ariaLabel: undefined, size: 'md' },
)
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const selected = computed(() => props.options.find((o) => o.value === props.modelValue))
/** 아래 공간이 모자라면 위로 펼친다. */
const dropUp = ref(false)

function toggle() {
  if (!open.value && root.value) {
    const rect = root.value.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom
    dropUp.value = below < 240 && rect.top > below
  }
  open.value = !open.value
}

function choose(value: string) {
  emit('update:modelValue', value)
  open.value = false
}

// 목록 밖을 누르면 닫는다.
function closeOnOutside(event: PointerEvent) {
  if (open.value && !root.value?.contains(event.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('pointerdown', closeOnOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOnOutside))
</script>

<style scoped lang="scss">
.select-menu {
  position: relative;

  &.open {
    z-index: 10;
  }
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  min-height: 46px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover,
  .open > & {
    border-color: var(--color-primary);
  }
}

.select-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.placeholder {
    color: var(--color-text-subtle);
  }
}

.select-chevron {
  flex: none;
  color: var(--color-text-subtle);
  font-size: 20px;
  line-height: 1;
  transform: rotate(90deg);
  transition: transform 0.15s;

  .open & {
    transform: rotate(-90deg);
  }
}

.select-options {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 100%;
  max-height: 280px;
  margin: 0;
  padding: var(--space-1);
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  list-style: none;

  &.up {
    top: auto;
    bottom: calc(100% + 6px);
  }
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  min-height: 42px;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: var(--color-surface-muted);
  }

  &.selected {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: 700;
  }
}

.option-text {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);

  small {
    color: var(--color-text-muted);
    font-size: 12px;
    font-weight: 400;
  }
}

.option-check {
  font-weight: 700;
}

.sm {
  .select-trigger {
    min-height: 30px;
    padding: 0 var(--space-2);
    border-radius: 8px;
    font-size: 13px;
  }

  .select-chevron {
    font-size: 16px;
  }

  .select-option {
    min-height: 38px;
    font-size: 14px;
  }
}
</style>
