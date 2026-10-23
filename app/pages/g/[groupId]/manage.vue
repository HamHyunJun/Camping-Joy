<template>
  <section class="manage">
    <NuxtLink :to="group.path()" class="back-link"><span class="back-icon" aria-hidden="true" />{{ group.current?.name }}</NuxtLink>
    <h1 class="page-title">모임 관리</h1>
    <p class="page-desc">가입 신청을 승인하고{{ group.isOwner ? ', 운영진을 지정해요.' : ' 구성원을 확인해요.' }}</p>

    <template v-if="group.isOwner">
      <h2 class="section-title">모임 정보</h2>
      <form class="card info" novalidate @submit.prevent="saveInfo">
        <div class="field">
          <label for="group-desc">설명 <small>(선택)</small></label>
          <textarea id="group-desc" v-model="description" class="input textarea" maxlength="100" rows="3" placeholder="어떤 모임인지 알려 주세요." />
        </div>
        <div class="field">
          <span id="group-region" class="label">지역</span>
          <SelectMenu v-model="region" :options="regionOptions" aria-label="모임 지역" />
        </div>
        <button class="btn btn-primary" type="submit" :disabled="busy || !infoChanged">{{ saved ? '저장했어요' : '저장' }}</button>
      </form>
    </template>

    <h2 class="section-title">가입 신청 {{ group.pending.length }}건</h2>
    <ul v-if="group.pending.length" class="people">
      <li v-for="member in group.pending" :key="member.user_id" class="card person">
        <span class="avatar-wrap"><img :src="avatarOf(member.user_id)" :alt="''" class="avatar-img" /></span>
        <span class="name">{{ nicknameOf(member.user_id) }}</span>
        <button class="btn btn-primary" type="button" :disabled="busy" @click="decide(member.user_id, true)">승인</button>
        <button class="btn" type="button" :disabled="busy" @click="decide(member.user_id, false)">거절</button>
      </li>
    </ul>
    <p v-else class="empty">대기 중인 가입 신청이 없어요.</p>

    <h2 class="section-title">구성원 {{ group.joined.length }}명</h2>
    <ul class="people">
      <li v-for="member in group.joined" :key="member.user_id" class="card person">
        <span class="avatar-wrap"><img :src="avatarOf(member.user_id)" :alt="''" class="avatar-img" /></span>
        <span class="name">
          {{ nicknameOf(member.user_id) }}
          <RoleBadge :role="member.role" />
        </span>
        <template v-if="group.isOwner && member.role !== 'owner'">
          <button v-if="member.role === 'member'" class="btn" type="button" :disabled="busy" @click="setRole(member.user_id, 'admin')">운영진으로 지정</button>
          <button v-else class="btn" type="button" :disabled="busy" @click="setRole(member.user_id, 'member')">운영진 해제</button>
        </template>
        <button v-if="canRemove(member)" class="btn btn-danger" type="button" :disabled="busy" @click="remove(member)">내보내기</button>
      </li>
    </ul>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>

    <template v-if="group.isOwner">
      <h2 class="section-title">모임 삭제</h2>
      <div class="card danger-zone">
        <p>모임을 지우면 등록된 멤버·장비·캠핑이 모두 사라지고 되돌릴 수 없어요.</p>
        <button class="btn btn-danger" type="button" :disabled="busy" @click="removeGroup">모임 삭제</button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ALL_REGIONS, REGIONS } from '~/constants/regions'
import tentIcon from '~/assets/icons/tent.svg'
import type { GroupMemberRow } from '~/types/database'

const group = useGroupStore()
const auth = useAuthStore()
const { ask } = useConfirm()

const error = ref('')
const busy = ref(false)

const regionOptions = [ALL_REGIONS, ...REGIONS].map((value) => ({ value, label: value }))
const description = ref(group.current?.description ?? '')
const region = ref(group.current?.region ?? ALL_REGIONS)
const saved = ref(false)
const infoChanged = computed(() => description.value.trim() !== group.current?.description || region.value !== group.current?.region)

const nicknameOf = (userId: string): string => group.profiles[userId]?.nickname ?? '이름 없음'
const avatarOf = (userId: string): string => {
  const path = group.profiles[userId]?.avatar
  return path ? auth.avatarUrl(path) : tentIcon
}

const run = async (task: Promise<string | undefined>): Promise<void> => {
  busy.value = true
  error.value = (await task) ?? ''
  busy.value = false
}

/** 관리자는 관리자 외 누구나, 운영진은 일반 멤버만 내보낼 수 있다. */
const canRemove = (member: GroupMemberRow): boolean =>
  member.user_id !== auth.user?.id && member.role !== 'owner' && (group.isOwner || member.role === 'member')

const remove = async (member: GroupMemberRow): Promise<void> => {
  const ok = await ask({
    title: '구성원 내보내기',
    message: `${nicknameOf(member.user_id)}님을 모임에서 내보낼까요?\n등록해 둔 멤버와 장비는 그대로 남아요.`,
    confirmLabel: '내보내기',
    danger: true,
  })
  if (ok) await run(group.removeMember(member.user_id))
}

const saveInfo = async (): Promise<void> => {
  if (!group.currentGroupId) return
  busy.value = true
  error.value = (await group.updateGroup(group.currentGroupId, { description: description.value, region: region.value })) ?? ''
  busy.value = false
  saved.value = !error.value
  if (saved.value) setTimeout(() => (saved.value = false), 2000)
}

const removeGroup = async (): Promise<void> => {
  const current = group.current
  if (!current) return
  const ok = await ask({
    title: '모임 삭제',
    message: `'${current.name}' 모임을 삭제할까요?\n구성원, 멤버·장비, 캠핑이 모두 지워지고 되돌릴 수 없어요.`,
    confirmLabel: '삭제',
    danger: true,
  })
  if (!ok) return
  busy.value = true
  const failure = await group.deleteGroup(current.id)
  busy.value = false
  if (failure) error.value = failure
  else await navigateTo('/')
}

const decide = (userId: string, approve: boolean): Promise<void> => run(group.decideJoin(userId, approve))
const setRole = (userId: string, role: 'admin' | 'member'): Promise<void> => run(group.setRole(userId, role))

// 관리자·운영진이 아니면 볼 수 없다.
if (!group.isStaff) await navigateTo(group.path())
</script>

<style scoped lang="scss">
.manage {
  max-width: 560px;
  margin: 0 auto;
}

.section-title {
  margin: var(--space-5) 0 var(--space-2);
  font-size: 15px;
}

.people {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.person {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);

  .name {
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    font-weight: 600;
  }

  .btn {
    flex: none;
    min-height: 38px;
    padding: 0 var(--space-3);
  }
}

.info {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-3);

  .field {
    margin-bottom: 0;
  }

  .label {
    font-size: 14px;
    font-weight: 600;
  }

  .textarea {
    min-height: 80px;
    padding: var(--space-3);
    resize: vertical;
  }

  .btn {
    justify-self: end;
  }
}

.danger-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);

  p {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 14px;
  }

  .btn {
    flex: none;
  }
}

.avatar-wrap {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-primary-soft);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
