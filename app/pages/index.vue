<template>
  <section class="groups">
    <h1 class="page-title">모임</h1>
    <p class="page-desc">함께 캠핑 가는 모임을 골라 들어가요. 처음이라면 모임을 찾아 가입을 신청해 주세요.</p>

    <div class="search">
      <img :src="searchIcon" alt="" width="20" height="20" />
      <input v-model="query" class="input search-input" type="search" placeholder="모임 이름으로 찾기" aria-label="모임 검색" autocomplete="off" />
      <button v-if="query" class="clear" type="button" aria-label="검색어 지우기" @click="query = ''">×</button>
    </div>

    <SelectMenu v-model="regionFilter" class="region-filter" :options="filterOptions" aria-label="지역으로 찾기" />

    <ul v-if="items.length" class="group-list">
      <li v-for="item in items" :key="item.id" class="card group-item">
        <NuxtLink v-if="isMember(item.id)" :to="`/g/${item.id}`" class="group-link">
          <span class="group-info">
            <span class="group-name">
              <strong>{{ item.name }}</strong>
              <RoleBadge :role="group.roleIn(item.id)" />
              <span class="count">{{ group.counts[item.id] ?? 0 }}명</span>
            </span>
            <span class="meta">{{ item.region }}<template v-if="item.description"> · {{ item.description }}</template></span>
          </span>
          <span class="chevron" aria-hidden="true">›</span>
        </NuxtLink>
        <div v-else class="group-link static">
          <span class="group-info">
            <span class="group-name">
              <strong>{{ item.name }}</strong>
              <span class="count">{{ group.counts[item.id] ?? 0 }}명</span>
            </span>
            <span class="meta">{{ item.region }}<template v-if="item.description"> · {{ item.description }}</template></span>
          </span>
          <span v-if="group.roleIn(item.id) === 'pending'" class="pending">
            승인 대기 중
            <button class="cancel" type="button" :disabled="busyId === item.id" aria-label="가입 신청 취소" title="가입 신청 취소" @click="cancel(item.id)">×</button>
          </span>
          <button v-else class="btn" type="button" :disabled="busyId === item.id" @click="join(item.id)">가입 신청</button>
        </div>
      </li>
    </ul>
    <p v-else class="empty">{{ keyword || regionFilter ? '조건에 맞는 모임이 없어요.' : '아직 만들어진 모임이 없어요.' }}</p>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>

    <button class="btn btn-primary create-open" type="button" @click="openCreate">＋ 새 모임 만들기</button>

    <ConfirmModal
      :open="creating"
      title="새 모임 만들기"
      confirm-label="만들기"
      :confirm-disabled="!newName.trim() || taken || busy"
      :alert="false"
      @confirm="create"
      @cancel="creating = false"
    >
      <div class="create-fields">
        <p class="create-desc">만든 사람이 관리자가 되고, 운영진을 지정하고 가입 신청을 승인할 수 있어요.</p>
        <div class="field">
          <label for="new-group">모임 이름</label>
          <input id="new-group" v-model="newName" class="input" type="text" maxlength="30" placeholder="예: 주말 캠핑 클럽" autocomplete="off" autofocus />
          <span v-if="taken" class="field-error" role="alert">{{ TAKEN }}</span>
        </div>
        <div class="field">
          <label for="new-group-desc">설명 <small>(선택)</small></label>
          <textarea id="new-group-desc" v-model="newDescription" class="input textarea" maxlength="100" rows="3" placeholder="어떤 모임인지 알려 주세요." />
        </div>
        <div class="field">
          <label for="new-group-region">지역</label>
          <select id="new-group-region" v-model="newRegion" class="input">
            <option v-for="option in regionOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
        <p v-if="createError" class="field-error" role="alert">{{ createError }}</p>
      </div>
    </ConfirmModal>
  </section>
</template>

<script setup lang="ts">
import searchIcon from '~/assets/icons/search.svg'
import { ALL_REGIONS, REGIONS } from '~/constants/regions'
import { TAKEN } from '~/stores/group'

const group = useGroupStore()

const query = ref('')
const newName = ref('')
const newDescription = ref('')
const newRegion = ref<string>(ALL_REGIONS)
const creating = ref(false)
const createError = ref('')
const regionFilter = ref('')
const error = ref('')
const busy = ref(false)
const busyId = ref('')

const regionOptions = [ALL_REGIONS, ...REGIONS].map((value) => ({ value, label: value }))
const filterOptions = [{ value: '', label: '모든 지역' }, ...regionOptions]
const taken = computed(() => group.nameTaken(newName.value))
const keyword = computed(() => query.value.trim())
/** 내가 속한 모임을 먼저 보여 준다. */
const items = computed(() =>
  group.groups
    .filter((g) => !keyword.value || g.name.includes(keyword.value))
    .filter((g) => !regionFilter.value || g.region === regionFilter.value)
    .sort((a, b) => Number(isMember(b.id)) - Number(isMember(a.id))),
)

const isMember = (groupId: string): boolean => {
  const role = group.roleIn(groupId)
  return Boolean(role) && role !== 'pending'
}

const join = async (groupId: string): Promise<void> => {
  busyId.value = groupId
  error.value = (await group.requestJoin(groupId)) ?? ''
  busyId.value = ''
}

const cancel = async (groupId: string): Promise<void> => {
  busyId.value = groupId
  error.value = (await group.cancelJoin(groupId)) ?? ''
  busyId.value = ''
}

const openCreate = (): void => {
  newName.value = ''
  newDescription.value = ''
  newRegion.value = ALL_REGIONS
  createError.value = ''
  creating.value = true
}

const create = async (): Promise<void> => {
  busy.value = true
  createError.value = ''
  const result = await group.createGroup({ name: newName.value, description: newDescription.value, region: newRegion.value })
  busy.value = false
  if (result.error) createError.value = result.error
  else if (result.id) {
    creating.value = false
    await navigateTo(`/g/${result.id}`)
  }
}

// 승인된 가입이나 새 모임이 바로 보이도록 들어올 때마다 다시 읽는다.
onMounted(() => group.loadGroups())
</script>

<style scoped lang="scss">
.search {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: var(--space-4);

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

.group-list {
  display: grid;
  gap: var(--space-2);
  margin: 0 0 var(--space-5);
  padding: 0;
  list-style: none;
}

.group-item {
  padding: 0;
}

.group-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: 60px;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius);
  color: inherit;
  text-decoration: none;
  transition:
    transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 160ms ease;

  &:not(.static):hover {
    background: var(--color-surface-muted);
  }

  &:not(.static):active {
    transform: scale(0.98);
  }

  // 가입 신청 카드는 모바일에서 설명 아래에 버튼(또는 대기 상태)을 둔다.
  @include mobile {
    &.static {
      flex-direction: column;
      align-items: stretch;

      .btn {
        width: 100%;
      }
    }
  }
}

.group-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.chevron {
  color: var(--color-text-subtle);
  font-size: 22px;
}

.pending {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: 14px;
}

.cancel {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover:not(:disabled) {
    background: var(--color-danger-soft);
    color: var(--color-danger);
  }

  &:active:not(:disabled) {
    transform: scale(0.9);
  }
}

.region-filter {
  margin-bottom: var(--space-4);
}

.group-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.count {
  flex: none;
  color: var(--color-text-muted);
  font-size: 13px;
}

.meta {
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.create-open {
  width: 100%;
}

.create-fields {
  display: grid;
  gap: var(--space-3);
  white-space: normal;
}

.create-desc {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 13px;
}

.field {
  margin-bottom: 0;

  label {
    font-size: 14px;
    font-weight: 600;
  }

  small {
    color: var(--color-text-muted);
    font-weight: 400;
  }
}

.textarea {
  min-height: 80px;
  padding: var(--space-3);
  resize: vertical;
}
</style>
