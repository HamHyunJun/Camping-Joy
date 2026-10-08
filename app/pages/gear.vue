<template>
  <section>
    <div class="hero">
      <div>
        <h1 class="page-title">멤버·장비 등록</h1>
        <p class="hero-desc">자주 함께 가는 사람과 각자 가진 장비를 한 번만 등록해 두면, 캠핑을 만들 때 불러올 수 있어요.</p>
      </div>
      <button v-if="!adding && gear.people.length" class="btn btn-primary" type="button" @click="openAdd">+ 멤버 추가</button>
    </div>

    <form v-if="adding" class="card add-form" @submit.prevent="addPerson(newName)">
      <label class="add-label" for="new-person">새 멤버 이름</label>
      <div class="add-row">
        <input
          id="new-person"
          ref="nameInput"
          v-model="newName"
          class="input"
          type="text"
          placeholder="이름"
          maxlength="20"
          autocomplete="off"
          @input="error = ''"
          @keydown.esc="closeAdd"
        />
        <button class="btn btn-primary" type="submit" :disabled="!newName.trim()">추가</button>
        <button class="btn btn-text" type="button" @click="closeAdd">취소</button>
      </div>
      <p v-if="error" class="field-error">{{ error }}</p>
    </form>

    <template v-if="gear.people.length">
      <div class="search">
        <img :src="searchIcon" alt="" width="20" height="20" />
        <input
          v-model="query"
          class="input search-input"
          type="search"
          placeholder="이름으로 멤버 찾기"
          aria-label="멤버 검색"
          autocomplete="off"
        />
        <button v-if="query" class="clear" type="button" aria-label="검색어 지우기" @click="query = ''">×</button>
      </div>
      <p class="count">
        {{ keyword ? `'${keyword}' 검색 결과 ${filteredPeople.length}명` : `멤버 ${gear.people.length}명` }}
      </p>

      <div v-if="filteredPeople.length" class="people">
        <PersonGearCard
          v-for="person in filteredPeople"
          :key="person.id"
          :person="person"
          :initially-open="person.id === lastAddedId || filteredPeople.length === 1"
        />
      </div>
      <div v-else class="empty no-result">
        <span>'{{ keyword }}' 이름의 멤버가 없어요.</span>
        <button class="btn" type="button" @click="addPerson(keyword)">+ '{{ keyword.slice(0, 20) }}' 멤버로 추가</button>
      </div>
    </template>
    <div v-else-if="!adding" class="empty no-result">
      <span>아직 등록된 멤버가 없어요.</span>
      <button class="btn btn-primary" type="button" @click="openAdd">+ 첫 멤버 추가</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import searchIcon from '~/assets/icons/search.svg'

const gear = useGearStore()

const query = ref('')
const adding = ref(false)
const newName = ref('')
const error = ref('')
const lastAddedId = ref<string | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)

const keyword = computed(() => query.value.trim())
const filteredPeople = computed(() =>
  keyword.value ? gear.people.filter((p) => p.name.includes(keyword.value)) : gear.people,
)

async function openAdd() {
  adding.value = true
  error.value = ''
  await nextTick()
  nameInput.value?.focus()
}

function closeAdd() {
  adding.value = false
  newName.value = ''
  error.value = ''
}

function addPerson(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return
  if (gear.findPersonByName(trimmed)) {
    error.value = '이미 등록된 이름이에요.'
    return
  }
  lastAddedId.value = gear.addPerson(trimmed)?.id ?? null
  query.value = ''
  closeAdd()
}
</script>

<style scoped lang="scss">
.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-5);

  .page-title {
    margin-bottom: 0;
  }

  .btn {
    flex: none;
  }
}

.hero-desc {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.add-form {
  margin-bottom: var(--space-4);
  border-color: var(--color-primary);
}

.add-label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: 14px;
  font-weight: 600;
}

.add-row {
  display: flex;
  gap: var(--space-2);
}

.search {
  position: relative;
  display: flex;
  align-items: center;

  img {
    position: absolute;
    left: var(--space-3);
    pointer-events: none;
  }
}

.search-input {
  padding-left: 42px;
  padding-right: 40px;
  border-radius: 999px;

  &::-webkit-search-cancel-button {
    display: none;
  }
}

.clear {
  position: absolute;
  right: var(--space-2);
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.count {
  margin: var(--space-4) 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 600;
}

.people {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.no-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}
</style>
