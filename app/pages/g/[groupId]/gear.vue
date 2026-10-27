<template>
  <section>
    <div class="hero">
      <div>
        <h1 class="page-title">멤버·장비 등록</h1>
        <p class="hero-desc">자주 함께 가는 사람과 각자 가진 장비를 한 번만 등록해 두면, 캠핑을 만들 때 불러올 수 있어요.</p>
      </div>
      <button v-if="!adding && gear.people.length" class="btn btn-primary" type="button" :disabled="!gear.canAddPerson" @click="openAdd">+ 멤버 추가</button>
    </div>
    <p v-if="!gear.canAddPerson" class="limit-note" role="status">
      내 계정으로 이미 등록했어요. 일반 멤버는 본인 한 명만 등록하고 내 장비만 고칠 수 있어요. 다른 멤버 등록과 삭제는 관리자·운영진이 해요.
    </p>

    <form v-if="adding" class="card add-form" @submit.prevent="addPerson(newName, linkMe())">
      <label class="add-label" for="new-person">{{ linkMe() && auth.enabled ? '내 이름' : '새 멤버 이름' }}</label>
      <label v-if="canChooseMe" class="link-me">
        <input v-model="forMe" type="checkbox" />
        내 계정의 멤버로 등록
      </label>
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
          :id="`person-${person.id}`"
          :key="person.id"
          :person="person"
          :initially-open="person.id === lastAddedId || filteredPeople.length === 1"
        />
      </div>
      <div v-else class="empty no-result">
        <span>'{{ keyword }}' 이름의 멤버가 없어요.</span>
        <button v-if="!auth.enabled || group.isStaff" class="btn" type="button" @click="addPerson(keyword, false)">+ '{{ keyword.slice(0, 20) }}' 멤버로 추가</button>
      </div>
    </template>
    <div v-else-if="!adding" class="empty no-result">
      <span>아직 등록된 멤버가 없어요.</span>
      <button class="btn btn-primary" type="button" :disabled="!gear.canAddPerson" @click="openAdd">+ 첫 멤버 추가</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import searchIcon from '~/assets/icons/search.svg'

const gear = useGearStore()
const auth = useAuthStore()
const group = useGroupStore()

const query = ref('')
const adding = ref(false)
const newName = ref('')
/** 관리자·운영진이 새 멤버를 내 계정의 멤버로 등록할지 */
const forMe = ref(true)
const error = ref('')
const lastAddedId = ref<string>()
const nameInput = ref<HTMLInputElement>()

const keyword = computed(() => query.value.trim())
const filteredPeople = computed(() =>
  keyword.value ? gear.people.filter((p) => p.name.includes(keyword.value)) : gear.people,
)

/** 관리자·운영진은 아직 내 멤버가 없을 때만 내 계정으로 등록할지 고른다. */
const canChooseMe = computed(() => auth.enabled && group.isStaff && !gear.myPerson)

/** 지금 추가하는 멤버를 내 계정과 연결하는지. 일반 멤버는 항상 본인으로 등록한다. */
const linkMe = (): boolean => (group.isStaff ? canChooseMe.value && forMe.value : true)

const openAdd = async (): Promise<void> => {
  adding.value = true
  error.value = ''
  // 로그인 중에는 프로필 닉네임을 내 이름 후보로 채운다.
  if (auth.enabled && linkMe() && !newName.value) newName.value = (auth.profile?.nickname ?? '').slice(0, 20)
  await nextTick()
  nameInput.value?.focus()
}

const closeAdd = (): void => {
  adding.value = false
  newName.value = ''
  error.value = ''
}

const addPerson = (name: string, linkToMe: boolean): void => {
  const trimmed = name.trim()
  if (!trimmed) return
  if (gear.findPersonByName(trimmed)) {
    error.value = '이미 등록된 이름이에요.'
    return
  }
  lastAddedId.value = gear.addPerson(trimmed, linkToMe)?.id
  query.value = ''
  closeAdd()
  scrollToLastAdded()
}

/** 새 멤버 카드는 목록 맨 아래에 생기므로, 렌더 후 그 카드로 스크롤을 따라간다. */
const scrollToLastAdded = async (): Promise<void> => {
  await nextTick()
  document.getElementById(`person-${lastAddedId.value}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
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

  // 모바일에서는 버튼을 설명 아래 한 줄로 내려 설명이 길게 꺾이지 않게 한다.
  @include mobile {
    flex-direction: column;
    align-items: stretch;

    .btn {
      width: 100%;
    }
  }

  .btn {
    flex: none;
  }
}

.link-me {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  font-size: 14px;
}

.limit-note {
  margin: calc(var(--space-2) * -1) 0 var(--space-4);
  color: var(--color-text-muted);
  font-size: 13px;
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
