<script setup lang="ts">
const gear = useGearStore()

const newName = ref('')
const error = ref('')
const lastAddedId = ref<string | null>(null)

function addPerson() {
  const name = newName.value.trim()
  if (!name) return
  if (gear.findPersonByName(name)) {
    error.value = '이미 등록된 이름이에요.'
    return
  }
  lastAddedId.value = gear.addPerson(name)?.id ?? null
  newName.value = ''
  error.value = ''
}
</script>

<template>
  <section>
    <h1 class="page-title">멤버·장비 등록</h1>
    <p class="page-desc">자주 함께 가는 사람과 각자 가진 장비를 한 번만 등록해 두면, 캠핑을 만들 때 불러올 수 있어요.</p>

    <form class="add-form" @submit.prevent="addPerson">
      <input
        v-model="newName"
        class="input"
        type="text"
        placeholder="이름"
        maxlength="20"
        autocomplete="off"
        @input="error = ''"
      />
      <button class="btn btn-primary" type="submit" :disabled="!newName.trim()">추가</button>
    </form>
    <p v-if="error" class="field-error">{{ error }}</p>

    <div v-if="gear.people.length" class="people">
      <PersonGearCard
        v-for="person in gear.people"
        :key="person.id"
        :person="person"
        :initially-open="person.id === lastAddedId"
      />
    </div>
    <p v-else class="empty">아직 등록된 사람이 없어요.</p>
  </section>
</template>

<style scoped lang="scss">
.add-form {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.people {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
</style>
