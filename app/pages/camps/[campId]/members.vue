<script setup lang="ts">
import type { Member, Person } from '~/types/camp'

const store = useCampStore()
const gear = useGearStore()
const route = useRoute()

const members = computed(() => store.currentCamp?.members ?? [])
/** 등록은 되어 있지만 아직 이 캠핑에 없는 사람 */
const candidates = computed(() =>
  gear.people.filter((p) => !members.value.some((m) => m.id === p.id)),
)

const newName = ref('')
const addError = ref('')

function addPerson(person: Person) {
  store.addMember(person)
}

function addByName() {
  const name = newName.value.trim()
  if (!name) return
  if (members.value.some((m) => m.name === name)) {
    addError.value = '이미 추가된 멤버예요.'
    return
  }
  // 멤버는 멤버·장비 등록에 있는 사람만 고를 수 있다.
  const person = gear.findPersonByName(name)
  if (!person) {
    addError.value = '등록되지 않은 사람이에요. 멤버·장비 등록에서 먼저 추가해 주세요.'
    return
  }
  store.addMember(person)
  newName.value = ''
  addError.value = ''
}

function remove(member: Member) {
  const message = member.equipments.length
    ? `${member.name}님과 담당으로 정한 장비를 빼시겠어요?`
    : `${member.name}님을 이번 캠핑에서 빼시겠어요?`
  if (!confirm(message)) return
  store.removeMember(member.id)
}

function bringingCount(member: Member): number {
  return member.equipments.reduce((sum, e) => sum + e.quantity, 0)
}

function reset() {
  if (!confirm('멤버를 모두 빼고 배분도 비울까요?')) return
  store.resetMembers()
}
</script>

<template>
  <section>
    <div class="page-head">
      <h1 class="page-title">멤버</h1>
      <button v-if="members.length" class="btn btn-text btn-danger" type="button" @click="reset">초기화</button>
    </div>
    <p class="page-desc">멤버·장비 등록에 있는 사람 중 함께 가는 사람을 골라 주세요.</p>
    <p v-if="!gear.people.length" class="notice">
      아직 등록된 사람이 없어요. <NuxtLink to="/gear">멤버·장비 등록</NuxtLink>에서 먼저 추가해 주세요.
    </p>

    <form class="add-form" @submit.prevent="addByName">
      <input
        v-model="newName"
        class="input"
        type="text"
        placeholder="등록된 사람 이름"
        maxlength="20"
        autocomplete="off"
        list="registered-people"
        @input="addError = ''"
      />
      <datalist id="registered-people">
        <option v-for="person in candidates" :key="person.id" :value="person.name" />
      </datalist>
      <button class="btn btn-primary" type="submit" :disabled="!newName.trim()">추가</button>
    </form>
    <p v-if="addError" class="field-error">
      {{ addError }} <NuxtLink v-if="addError.startsWith('등록되지')" to="/gear">등록하러 가기</NuxtLink>
    </p>

    <div v-if="candidates.length" class="candidates">
      <span class="candidates-label">등록된 사람</span>
      <button v-for="person in candidates" :key="person.id" class="chip" type="button" @click="addPerson(person)">
        + {{ person.name }}
        <small>장비 {{ person.equipments.length }}</small>
      </button>
    </div>

    <ul v-if="members.length" class="member-list card">
      <li v-for="member in members" :key="member.id" class="member-item">
        <span class="avatar">{{ member.name.slice(0, 1) }}</span>
        <span class="name">{{ member.name }}</span>
        <span class="count">담당 장비 {{ bringingCount(member) }}개</span>
        <button class="btn btn-text btn-danger" type="button" @click="remove(member)">빼기</button>
      </li>
    </ul>
    <p v-else class="empty">아직 멤버가 없어요.</p>

    <div class="page-actions">
      <NuxtLink class="btn" :to="`/camps/${route.params.campId}/info`">이전</NuxtLink>
      <NuxtLink v-if="members.length" class="btn btn-primary" :to="`/camps/${route.params.campId}/distribute`">
        다음: 장비 배분
      </NuxtLink>
      <button v-else class="btn btn-primary" type="button" disabled>다음: 장비 배분</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.notice {
  margin: 0 0 var(--space-3);
  padding: var(--space-3);
  border-radius: 8px;
  background: var(--color-primary-soft);
  font-size: 14px;
}

.add-form {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.candidates {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.candidates-label {
  width: 100%;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
}

.chip {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 14px;
  cursor: pointer;

  small {
    margin-left: 2px;
    color: var(--color-text-muted);
  }
}

.member-list {
  margin: var(--space-4) 0 0;
  padding: var(--space-1) var(--space-4);
  list-style: none;
}

.member-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 56px;

  & + & {
    border-top: 1px solid var(--color-border);
  }
}

.avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 14px;
}

.name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.count {
  color: var(--color-text-muted);
  font-size: 13px;
}
</style>
