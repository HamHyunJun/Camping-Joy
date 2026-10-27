<template>
  <section>
    <div class="page-head">
      <h1 class="page-title">멤버</h1>
      <button v-if="members.length" class="btn btn-text btn-danger" type="button" @click="reset">초기화</button>
    </div>
    <p class="page-desc">멤버·장비 등록에 있는 사람 중 함께 가는 사람을 골라 주세요.</p>
    <p v-if="!gear.people.length" class="notice">
      아직 등록된 사람이 없어요. <NuxtLink :to="group.path('/gear')">멤버·장비 등록</NuxtLink>에서 먼저 추가해 주세요.
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
      {{ addError }} <NuxtLink v-if="addError.startsWith('등록되지')" :to="group.path('/gear')">등록하러 가기</NuxtLink>
    </p>

    <div v-if="candidates.length" class="candidates">
      <span class="candidates-label">등록된 사람 {{ candidates.length }}명</span>
      <button v-for="person in candidates" :key="person.id" class="chip" type="button" @click="addPerson(person)">
        + {{ person.name }}
        <small>장비 {{ person.equipments.length }}</small>
      </button>
    </div>

    <form class="add-form guest-form" @submit.prevent="addGuest">
      <input
        v-model="guestName"
        class="input"
        type="text"
        placeholder="게스트 이름 (이번 캠핑에만 추가)"
        maxlength="20"
        autocomplete="off"
        aria-label="게스트 이름"
      />
      <button class="btn" type="submit" :disabled="!guestName.trim()">게스트 추가</button>
    </form>

    <p v-if="members.length" class="member-total">이번 캠핑 멤버 {{ members.length }}명</p>
    <ul v-if="members.length" class="member-list card">
      <li v-for="member in members" :key="member.id" class="member-item">
        <span class="avatar">{{ member.name.slice(0, 1) }}</span>
        <span class="name">{{ member.name }}<small v-if="member.guest" class="guest-tag">게스트</small></span>
        <!-- 모바일에서는 이름표처럼 작게 보여 주려고 담당 장비는 있을 때만 숫자로 줄인다. -->
        <span v-if="!isMobile || bringingCount(member)" class="count">{{ isMobile ? bringingCount(member) : `담당 장비 ${bringingCount(member)}개` }}</span>
        <button class="btn btn-text btn-danger" type="button" :aria-label="`${member.name} 빼기`" @click="remove(member)">{{ isMobile ? '×' : '빼기' }}</button>
      </li>
    </ul>
    <p v-else class="empty">아직 멤버가 없어요.</p>

    <div class="page-actions">
      <NuxtLink class="btn" :to="group.path(`/camps/${route.params.campId}/info`)">이전</NuxtLink>
      <NuxtLink v-if="members.length" class="btn btn-primary" :to="group.path(`/camps/${route.params.campId}/distribute`)">
        다음: 장비 배분
      </NuxtLink>
      <button v-else class="btn btn-primary" type="button" disabled>다음: 장비 배분</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Member, Person } from '~/types/camp'

const group = useGroupStore()

const store = useCampStore()
const { ask } = useConfirm()
const gear = useGearStore()
const route = useRoute()
const isMobile = useIsMobile()

const newName = ref('')
const guestName = ref('')
const addError = ref('')

const members = computed(() => store.currentCamp?.members ?? [])
/** 등록은 되어 있지만 아직 이 캠핑에 없는 사람 */
const candidates = computed(() =>
  gear.people.filter((p) => !members.value.some((m) => m.id === p.id)),
)

const addPerson = (person: Person): void => {
  store.addMember(person)
}

const addByName = (): void => {
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

const addGuest = (): void => {
  const name = guestName.value.trim()
  if (!name) return
  if (members.value.some((m) => m.name === name)) {
    addError.value = '이미 추가된 멤버예요.'
    return
  }
  store.addGuest(name)
  guestName.value = ''
  addError.value = ''
}

const remove = async (member: Member): Promise<void> => {
  const message = member.equipments.length
    ? `${member.name}님과 담당으로 정한 장비를 빼시겠어요?`
    : `${member.name}님을 이번 캠핑에서 빼시겠어요?`
  if (await ask({ title: '멤버 빼기', message, confirmLabel: '빼기', danger: true })) store.removeMember(member.id)
}

const bringingCount = (member: Member): number => member.equipments.reduce((sum, e) => sum + e.quantity, 0)

const reset = async (): Promise<void> => {
  if (await ask({ title: '멤버 모두 빼기', message: '멤버를 모두 빼고 배분도 비울까요?', confirmLabel: '모두 빼기', danger: true })) store.resetMembers()
}
</script>

<style scoped lang="scss">
.add-form {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.guest-form {
  margin-top: var(--space-3);
}

.guest-tag {
  margin-left: var(--space-2);
  color: var(--color-text-muted);
  font-size: 12px;
}

// 등록된 사람이 많아도 화면을 다 차지하지 않게 일정 높이까지만 보이고 안에서 넘긴다.
.candidates {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  max-height: 176px;
  margin-top: var(--space-3);
  padding: var(--space-3);
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
}

.candidates-label {
  width: 100%;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
}

.member-total {
  margin: var(--space-4) 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
}

.member-list {
  margin: 0;
  padding: var(--space-1) var(--space-4);
  list-style: none;

  // 모바일에서는 줄 대신 이름표(칩)로 모아서 많아도 짧게 보이게 한다.
  @include mobile {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    padding: var(--space-3);
  }
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

@include mobile {
  .member-item {
    min-height: 36px;
    padding: 0 var(--space-1) 0 var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface-muted);

    & + & {
      border-top: 1px solid var(--color-border);
    }

    .avatar {
      display: none;
    }

    .name {
      flex: none;
      max-width: 160px;
    }

    .count {
      min-width: 18px;
      padding: 0 5px;
      border-radius: 999px;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      font-size: 12px;
      font-weight: 700;
      text-align: center;
    }

    .btn-text {
      min-height: 28px;
      padding: 0 var(--space-2);
    }
  }
}
</style>
