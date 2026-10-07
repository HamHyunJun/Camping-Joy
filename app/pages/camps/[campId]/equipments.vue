<script setup lang="ts">
const store = useCampStore()
const route = useRoute()

const members = computed(() => store.currentCamp?.members ?? [])
</script>

<template>
  <section>
    <h1 class="page-title">장비 넣기</h1>
    <p class="page-desc">멤버마다 등록된 장비 중 이번 캠핑에 가져갈 수 있는 것을 넣어 주세요.</p>

    <div v-if="members.length" class="members">
      <MemberEquipmentCard v-for="member in members" :key="member.id" :member="member" />
    </div>
    <p v-else class="empty">먼저 멤버를 추가해 주세요.</p>

    <div class="page-actions">
      <NuxtLink class="btn" :to="`/camps/${route.params.campId}/members`">이전</NuxtLink>
      <NuxtLink class="btn btn-primary" :to="`/camps/${route.params.campId}/distribute`">다음: 장비 배분</NuxtLink>
    </div>
  </section>
</template>

<style scoped lang="scss">
.members {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>
