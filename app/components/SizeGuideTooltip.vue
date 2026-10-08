<template>
  <span ref="root" class="size-guide">
    <button
      type="button"
      class="info-button"
      :aria-expanded="open"
      :aria-label="`${guide.title} 보기`"
      @click.stop="open = !open"
    >
      <img :src="infoIcon" alt="" width="18" height="18" />
    </button>
    <span v-if="open" class="tooltip" role="tooltip" @click="open = false">
      <strong>{{ guide.title }}</strong>
      <span v-for="option in guide.options" :key="option.label" class="row">
        <b>{{ option.label }}</b>
        <span v-if="option.description">{{ option.description }}</span>
      </span>
    </span>
  </span>
</template>

<script setup lang="ts">
import infoIcon from '~/assets/icons/info.svg'
import type { EquipmentSizeGuide } from '~/constants/equipment'

defineProps<{ guide: EquipmentSizeGuide }>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function onOutside(event: Event) {
  if (root.value && !root.value.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('pointerdown', onOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))
</script>

<style scoped lang="scss">
.size-guide {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}

.info-button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}

.tooltip {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 150px;
  padding: var(--space-2) var(--space-3);
  border-radius: 8px;
  background: var(--color-text);
  color: #fff;
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
  transform: translateX(-50%);
  box-shadow: 0 6px 16px rgb(0 0 0 / 18%);

  strong {
    margin-bottom: 2px;
    font-size: 12px;
    opacity: 0.8;
  }
}

.row {
  display: flex;
  gap: var(--space-2);

  b {
    min-width: 52px;
  }
}
</style>
