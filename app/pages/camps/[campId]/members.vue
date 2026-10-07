<script setup lang="ts">
import type { ID, Member } from '~/types/camp'

const store = useCampStore()
const route = useRoute()

const members = computed(() => store.currentCamp?.members ?? [])

const newName = ref('')
const addError = ref('')

const editingId = ref<ID | null>(null)
const editingName = ref('')

function isDuplicateName(name: string, exceptId?: ID): boolean {
  const target = name.trim()
  return members.value.some((m) => m.id !== exceptId && m.name === target)
}

function add() {
  const name = newName.value.trim()
  if (!name) return
  if (isDuplicateName(name)) {
    addError.value = '이미 같은 이름의 멤버가 있어요.'
    return
  }
  store.addMember(name)
  newName.value = ''
  addError.value = ''
}

function startEdit(member: Member) {
  editingId.value = member.id
  editingName.value = member.name
}

function saveEdit() {
  const id = editingId.value
  if (!id) return
  const name = editingName.value.trim()
  if (name && !isDuplicateName(name, id)) store.renameMember(id, name)
  editingId.value = null
}

function remove(member: Member) {
  const message = member.equipments.length
    ? `${member.name}님과 등록된 장비 ${member.equipments.length}개를 삭제할까요?`
    : `${member.name}님을 삭제할까요?`
  if (!confirm(message)) return
  store.removeMember(member.id)
}
</script>

<template>
  <section>
    <h1 class="page-title">멤버 관리</h1>
    <p class="page-desc">함께 캠핑 가는 사람을 추가해 주세요.</p>

    <form class="add-form" @submit.prevent="add">
      <input
        v-model="newName"
        class="input"
        type="text"
        placeholder="이름"
        maxlength="20"
        autocomplete="off"
        @input="addError = ''"
      />
      <button class="btn btn-primary" type="submit" :disabled="!newName.trim()">추가</button>
    </form>
    <p v-if="addError" class="field-error">{{ addError }}</p>

    <ul v-if="members.length" class="member-list card">
      <li v-for="member in members" :key="member.id" class="member-item">
        <form v-if="editingId === member.id" class="edit-form" @submit.prevent="saveEdit">
          <input v-model="editingName" class="input" type="text" maxlength="20" autofocus />
          <button class="btn" type="submit">저장</button>
        </form>
        <template v-else>
          <span class="avatar">{{ member.name.slice(0, 1) }}</span>
          <span class="name">{{ member.name }}</span>
          <button class="btn btn-text" type="button" @click="startEdit(member)">수정</button>
          <button class="btn btn-text btn-danger" type="button" @click="remove(member)">삭제</button>
        </template>
      </li>
    </ul>
    <p v-else class="empty">아직 멤버가 없어요.</p>

    <div class="page-actions">
      <NuxtLink class="btn" :to="`/camps/${route.params.campId}/info`">이전</NuxtLink>
      <NuxtLink v-if="members.length" class="btn btn-primary" :to="`/camps/${route.params.campId}/equipments`">
        다음: 장비 등록
      </NuxtLink>
      <button v-else class="btn btn-primary" type="button" disabled>다음: 장비 등록</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.add-form,
.edit-form {
  display: flex;
  gap: var(--space-2);
}

.add-form {
  margin-bottom: var(--space-2);
}

.edit-form {
  flex: 1;
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
</style>
