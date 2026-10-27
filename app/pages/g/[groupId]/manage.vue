<template>
  <section class="manage">
    <NuxtLink :to="group.path()" class="back-link pc-only"><span class="back-icon" aria-hidden="true" />{{ group.current?.name }}</NuxtLink>
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

    <h2 class="section-title">
      가입 신청 {{ group.pending.length }}건
      <span v-if="group.pending.length" class="dot" aria-hidden="true" />
    </h2>
    <ul v-if="group.pending.length" class="people">
      <li v-for="member in group.pending" :key="member.user_id" class="card person">
        <span class="avatar-wrap"><img :src="avatarOf(member.user_id)" :alt="''" class="avatar-img" /></span>
        <span class="name">{{ nicknameOf(member.user_id) }}</span>
        <span class="actions">
          <button class="btn btn-primary" type="button" :disabled="busy" @click="decide(member.user_id, true)">승인</button>
          <button class="btn" type="button" :disabled="busy" @click="decide(member.user_id, false)">거절</button>
        </span>
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
        <!-- PC: 이름 아래에 버튼을 늘어놓는다. 모바일: 오른쪽 메뉴 버튼 안에 모은다. -->
        <span v-if="!isMobile" class="actions">
          <button
            v-for="action in actionsOf(member)"
            :key="action.label"
            class="btn"
            :class="{ 'btn-danger': action.danger }"
            type="button"
            :disabled="busy"
            @click="action.run()"
          >
            {{ action.label }}
          </button>
        </span>
        <div v-else-if="actionsOf(member).length" class="row-menu">
          <button
            class="menu-trigger"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="openMenuId === member.user_id"
            :aria-label="`${nicknameOf(member.user_id)} 관리 메뉴`"
            @click="openMenuId = openMenuId === member.user_id ? undefined : member.user_id"
          >
            <span class="dots" aria-hidden="true" />
          </button>
          <Transition name="menu">
            <div v-if="openMenuId === member.user_id" class="menu-list" role="menu">
              <button
                v-for="action in actionsOf(member)"
                :key="action.label"
                class="menu-entry"
                :class="{ danger: action.danger }"
                type="button"
                role="menuitem"
                :disabled="busy"
                @click="pick(action)"
              >
                {{ action.label }}
              </button>
            </div>
          </Transition>
        </div>
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
const isMobile = useIsMobile()

interface MemberAction {
  label: string
  danger?: boolean
  run: () => void
}

const error = ref('')
const busy = ref(false)
/** 모바일에서 메뉴가 열려 있는 구성원 */
const openMenuId = ref<string>()

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

const transfer = async (member: GroupMemberRow): Promise<void> => {
  const ok = await ask({
    title: '관리자 위임',
    message: `${nicknameOf(member.user_id)}님에게 관리자를 넘길까요?\n나는 운영진이 되고, 모임 정보 수정·삭제와 운영진 지정은 할 수 없게 돼요.`,
    confirmLabel: '위임',
    danger: true,
  })
  if (ok) await run(group.transferOwnership(member.user_id))
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

/** 구성원에게 할 수 있는 일. PC는 버튼으로, 모바일은 메뉴로 보여 준다. */
const actionsOf = (member: GroupMemberRow): MemberAction[] => {
  const actions: MemberAction[] = []
  if (group.isOwner && member.role !== 'owner') {
    if (member.role === 'member') actions.push({ label: '운영진 지정', run: () => setRole(member.user_id, 'admin') })
    else actions.push({ label: '운영진 해제', run: () => setRole(member.user_id, 'member') }, { label: '관리자 위임', run: () => transfer(member) })
  }
  if (canRemove(member)) actions.push({ label: '내보내기', danger: true, run: () => remove(member) })
  return actions
}

const pick = (action: MemberAction): void => {
  openMenuId.value = undefined
  action.run()
}

// 메뉴 밖을 누르거나 Esc를 누르면 닫는다. 열려 있는 동안만 듣는다.
const closeMenuOutside = (event: Event): void => {
  if (event instanceof KeyboardEvent ? event.key === 'Escape' : !(event.target as Element).closest('.row-menu')) openMenuId.value = undefined
}

const decide = (userId: string, approve: boolean): Promise<void> => run(group.decideJoin(userId, approve))
const setRole = (userId: string, role: 'admin' | 'member'): Promise<void> => run(group.setRole(userId, role))

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMenuOutside)
  document.removeEventListener('keydown', closeMenuOutside)
})

// 관리자·운영진이 아니면 볼 수 없다.
if (!group.isStaff) await navigateTo(group.path())

watch(openMenuId, (id) => {
  const listen = id ? document.addEventListener : document.removeEventListener
  listen.call(document, 'click', closeMenuOutside)
  listen.call(document, 'keydown', closeMenuOutside)
})
watch(isMobile, () => (openMenuId.value = undefined))
</script>

<style scoped lang="scss">
.section-title {
  margin: var(--space-5) 0 var(--space-2);
  font-size: 15px;
}

// 처리할 가입 신청이 있다는 표시. 제목 글자 우측 상단에 붙는다.
.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-left: 2px;
  vertical-align: top;
  border-radius: 50%;
  background: var(--color-danger);
}

.people {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

// 첫 줄은 아바타·이름, 둘째 줄은 이름 아래에 버튼을 둔다(320px에서도 잘리지 않게).
.person {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-2) var(--space-3);
  padding: var(--space-3);

  .name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-2);
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    grid-column: 2;
    justify-content: flex-end;
    gap: var(--space-2);

    &:empty {
      display: none;
    }
  }

  .btn {
    flex: none;
    min-height: 34px;
    padding: 0 var(--space-3);
    font-size: 13px;
  }
}

// 모바일 구성원 메뉴: 줄 오른쪽 끝의 점 세 개 버튼과 그 아래 펼쳐지는 목록
.person:has(.row-menu) {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.row-menu {
  position: relative;
}

.menu-trigger {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-right: calc(var(--space-2) * -1);
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background-color 160ms ease,
    transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover,
  &[aria-expanded='true'] {
    background: var(--color-surface-muted);
  }

  &:active {
    transform: scale(0.92);
  }
}

// 세로 점 세 개
.dots {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentcolor;
  box-shadow:
    0 -6px 0 currentcolor,
    0 6px 0 currentcolor;
}

.menu-list {
  position: absolute;
  top: calc(100% + var(--space-1));
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  min-width: 140px;
  padding: var(--space-1);
  transform-origin: top right;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
}

.menu-entry {
  min-height: 44px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 14px;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--color-surface-muted);
  }

  &.danger {
    color: var(--color-danger);

    &:hover:not(:disabled) {
      background: var(--color-danger-soft);
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.menu-enter-active,
.menu-leave-active {
  transition:
    opacity 140ms ease,
    transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

@media (prefers-reduced-motion: reduce) {
  .menu-enter-active,
  .menu-leave-active {
    transition: none;
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

  // 모바일에서는 설명 아래에 버튼을 한 줄로 둔다.
  @include mobile {
    flex-direction: column;
    align-items: stretch;

    .btn {
      width: 100%;
    }
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
