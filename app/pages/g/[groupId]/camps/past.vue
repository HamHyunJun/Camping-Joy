<template>
  <section>
    <NuxtLink :to="group.path()" class="back-link"><span class="back-icon" aria-hidden="true" />전체 캠핑</NuxtLink>
    <h1 class="page-title">지난 캠핑</h1>
    <p class="page-desc">날짜가 지난 캠핑이에요. 최근에 다녀온 캠핑이 먼저 보여요.</p>

    <ul v-if="store.pastCamps.length" class="camp-list">
      <CampListItem v-for="camp in store.pastCamps" :key="camp.id" :camp="camp" />
    </ul>
    <p v-else class="empty">지난 캠핑이 없어요.</p>
  </section>
</template>

<script setup lang="ts">

const group = useGroupStore()
const store = useCampStore()
</script>

<style scoped lang="scss">
.camp-list {
  display: grid;
  // 칸이 긴 캠핑 이름만큼 넓어져 화면 밖으로 나가지 않게 한다.
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;

  @include pc {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
