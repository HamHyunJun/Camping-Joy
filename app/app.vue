<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ConfirmModal
    :open="Boolean(request)"
    :title="shown?.title ?? ''"
    :confirm-label="shown?.confirmLabel"
    :danger="shown?.danger"
    @confirm="answer(true)"
    @cancel="answer(false)"
  >
    {{ shown?.message }}
  </ConfirmModal>
</template>

<script setup lang="ts">
const { request, answer } = useConfirm()

// 닫히는 애니메이션 동안 내용이 비지 않도록 마지막 요청을 남겨 둔다.
const shown = ref(request.value)

watch(request, (next) => {
  if (next) shown.value = next
})
</script>
