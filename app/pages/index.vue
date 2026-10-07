<script setup lang="ts">
const store = useCampStore()

function startNewCamp() {
  const campId = store.createCamp()
  navigateTo(`/camps/${campId}/info`)
}

function removeCamp(campId: string, name: string) {
  if (!confirm(`'${name || '이름 없는 캠핑'}'을(를) 삭제할까요?`)) return
  store.deleteCamp(campId)
}
</script>

<template>
  <section>
    <h1 class="page-title">내 캠핑</h1>

    <button class="btn btn-primary new-camp" type="button" @click="startNewCamp">
      + 새 캠핑 만들기
    </button>

    <ul v-if="store.sortedCamps.length" class="camp-list">
      <li v-for="camp in store.sortedCamps" :key="camp.id" class="card camp-item">
        <NuxtLink :to="`/camps/${camp.id}/info`" class="camp-link">
          <strong>{{ camp.name || '이름 없는 캠핑' }}</strong>
          <span class="meta">{{ formatDate(camp.date) }} · 멤버 {{ camp.members.length }}명</span>
        </NuxtLink>
        <button class="btn btn-text btn-danger" type="button" @click="removeCamp(camp.id, camp.name)">
          삭제
        </button>
      </li>
    </ul>
    <p v-else class="empty">아직 만든 캠핑이 없어요. 새 캠핑을 만들어 준비를 시작해 보세요.</p>
  </section>
</template>

<style scoped lang="scss">
.new-camp {
  width: 100%;
  margin-bottom: var(--space-4);
}

.camp-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.camp-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.camp-link {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  text-decoration: none;

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.meta {
  color: var(--color-text-muted);
  font-size: 14px;
}
</style>
