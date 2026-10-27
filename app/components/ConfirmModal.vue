<template>
  <dialog
    ref="dialog"
    class="modal"
    :class="{ closing }"
    :role="alert ? 'alertdialog' : 'dialog'"
    :aria-labelledby="titleId"
    :aria-describedby="bodyId"
    @cancel.prevent="emit('cancel')"
    @click.self="emit('cancel')"
    @animationend.self="onAnimationEnd"
  >
    <form class="panel" @submit.prevent="emit('confirm')">
      <h2 :id="titleId" class="title">{{ title }}</h2>
      <div :id="bodyId" class="body"><slot /></div>
      <div class="actions">
        <!-- 되돌릴 수 없는 작업이 많아서 처음 포커스는 취소에 둔다. -->
        <button class="btn" type="button" autofocus @click="emit('cancel')">{{ cancelLabel }}</button>
        <button class="btn confirm" :class="{ danger }" type="submit" :disabled="confirmDisabled">{{ confirmLabel }}</button>
      </div>
    </form>
  </dialog>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ open: boolean; title: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; confirmDisabled?: boolean; alert?: boolean }>(), {
  confirmLabel: '확인',
  cancelLabel: '취소',
  danger: false,
  confirmDisabled: false,
  alert: true,
})

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const dialog = ref<HTMLDialogElement>()
const titleId = useId()
const bodyId = useId()

const closing = ref(false)

// 네이티브 <dialog>가 배경 비활성, 포커스 가두기, Esc를 맡는다.
// 닫을 때는 퇴장 애니메이션이 끝난 뒤 닫는다. 애니메이션을 줄인 환경에서는 바로 닫는다.
const sync = (open: boolean): void => {
  closing.value = false
  if (open && !dialog.value?.open) dialog.value?.showModal()
  if (!open && dialog.value?.open) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) dialog.value.close()
    else closing.value = true
  }
}

const onAnimationEnd = (): void => {
  if (!closing.value) return
  closing.value = false
  dialog.value?.close()
}

onMounted(() => sync(props.open))
watch(() => props.open, sync, { flush: 'post' })
</script>

<style scoped lang="scss">
.modal {
  width: calc(100% - var(--space-8));
  max-width: 400px;
  padding: 0;
  border: 0;
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-md);

  &[open] {
    animation: modal-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &::backdrop {
    background: rgb(0 0 0 / 35%);
  }

  &[open]::backdrop {
    animation: backdrop-in 160ms ease;
  }

  &.closing {
    animation: modal-out 140ms ease forwards;

    &::backdrop {
      animation: backdrop-out 140ms ease forwards;
    }
  }
}

.panel {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
}

.title {
  margin: 0;
  font-size: 17px;
}

.body {
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-line;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.btn {
  min-height: 42px;
  transition: transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);

  &:active {
    transform: scale(0.96);
  }
}

.confirm {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #fff;

  &:hover:not(:disabled) {
    border-color: var(--color-primary-strong);
    background: var(--color-primary-strong);
  }

  &.danger {
    border-color: var(--color-danger);
    background: var(--color-danger);

    &:hover:not(:disabled) {
      border-color: var(--color-danger);
      background: var(--color-danger);
      filter: brightness(0.92);
    }
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
}

@keyframes modal-out {
  to {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
}

@keyframes backdrop-in {
  from {
    opacity: 0;
  }
}

@keyframes backdrop-out {
  to {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal[open],
  .modal[open]::backdrop,
  .btn {
    animation: none;
    transition: none;
  }
}
</style>
