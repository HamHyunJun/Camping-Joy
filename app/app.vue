<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ConfirmModal
    :open="Boolean(request)"
    :title="request?.title ?? ''"
    :confirm-label="request?.confirmLabel"
    :danger="request?.danger"
    @confirm="answer(true)"
    @cancel="answer(false)"
  >
    {{ request?.message }}
  </ConfirmModal>
</template>

<script setup lang="ts">
const { request, answer } = useConfirm()
</script>
