<template>
  <section class="profile">
    <h1 class="page-title">{{ isFirst ? '프로필을 만들어요' : '프로필' }}</h1>
    <p class="page-desc">캠핑 멤버에게 보일 모습이에요. 나중에 언제든 바꿀 수 있어요.</p>

    <form class="card" novalidate @submit.prevent="submit">
      <fieldset class="avatar-field">
        <legend>프로필 이미지</legend>
        <p class="avatar-preview">
          <img v-if="preview" :src="preview" alt="선택한 프로필 이미지" class="avatar-image" />
          <img v-else :src="tentIcon" alt="기본 프로필 이미지(텐트)" class="avatar-default" />
        </p>
        <div class="avatar-actions">
          <button class="btn" type="button" @click="fileInput?.click()">이미지 등록</button>
          <button v-if="preview" class="btn btn-text" type="button" @click="useDefaultAvatar">기본 이미지로</button>
        </div>
        <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" hidden @change="onPick" />
      </fieldset>

      <div class="field">
        <label for="nickname">닉네임</label>
        <input id="nickname" v-model="nickname" class="input" type="text" maxlength="12" placeholder="12자까지" autocomplete="nickname" required />
      </div>

      <div class="field">
        <label for="greeting">인사말 <span class="optional">(선택)</span></label>
        <input id="greeting" v-model="greeting" class="input" type="text" maxlength="30" placeholder="예: 불멍 담당이에요" />
      </div>

      <p v-if="error" class="field-error" role="alert">{{ error }}</p>

      <button class="btn btn-primary submit" type="submit" :disabled="busy">{{ isFirst ? '시작하기' : '저장' }}</button>
    </form>

    <!-- 처음 프로필을 만드는 중에는 아직 보여 줄 모임이 없다. -->
    <template v-if="!isFirst">
      <h2 class="section-title">내 모임</h2>
      <ul v-if="myGroups.length" class="groups">
        <li v-for="item in myGroups" :key="item.id" class="card group-item">
          <NuxtLink v-if="item.role !== 'pending'" :to="`/g/${item.id}`" class="group-link">
            <span class="group-name">
              <strong>{{ item.name }}</strong>
              <RoleBadge :role="item.role" />
            </span>
            <span class="chevron" aria-hidden="true">›</span>
          </NuxtLink>
          <div v-else class="group-link static">
            <strong>{{ item.name }}</strong>
            <span class="pending">
              <span class="meta">승인 대기 중</span>
              <button class="cancel" type="button" :disabled="busyId === item.id" aria-label="가입 신청 취소" title="가입 신청 취소" @click="cancel(item.id)">×</button>
            </span>
          </div>
        </li>
      </ul>
      <p v-else class="empty">아직 들어간 모임이 없어요.</p>
      <p v-if="cancelError" class="field-error" role="alert">{{ cancelError }}</p>
      <NuxtLink to="/" class="btn find">모임 찾기·만들기</NuxtLink>
    </template>
  </section>
</template>

<script setup lang="ts">
import tentIcon from '~/assets/icons/tent.svg'

const AVATAR_SIZE = 256

const auth = useAuthStore()
const group = useGroupStore()
const router = useRouter()

// 처음에는 카카오에서 받은 이름을 닉네임 후보로 채운다.
const isFirst = !auth.profile?.nickname
/** 고치러 들어온 거라면 저장한 뒤 보던 화면으로 돌아간다. 처음 만들 때나 주소로 바로 들어왔으면 모임 목록으로 간다. */
const previous = isFirst ? undefined : (router.options.history.state.back ?? undefined)
const nickname = ref(auth.profile?.nickname ?? String(auth.user?.user_metadata?.name ?? '').slice(0, 12))
const greeting = ref(auth.profile?.greeting ?? '')
/** 이미 올려 둔 이미지의 경로. 없으면 기본 이미지(텐트) */
const avatarPath = ref(auth.profile?.avatar ?? undefined)
/** 새로 고른 이미지(저장할 때 올린다)와 그 미리보기 주소 */
const pendingImage = ref<Blob>()
const pendingUrl = ref<string>()
const fileInput = ref<HTMLInputElement>()
const error = ref('')
const busy = ref(false)
const busyId = ref('')
const cancelError = ref('')

/** 내가 속했거나 신청한 모임 */
const myGroups = computed(() =>
  group.mine.flatMap((m) => {
    const found = group.groups.find((g) => g.id === m.group_id)
    return found ? [{ ...found, role: m.role }] : []
  }),
)

const preview = computed(() => pendingUrl.value ?? (avatarPath.value ? auth.avatarUrl(avatarPath.value) : undefined))

/** 가운데를 정사각형으로 잘라 줄인다. 올리는 용량과 불러오는 시간을 줄이려는 것이다. */
const resizeToSquare = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  bitmap.close()
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob'))), 'image/jpeg', 0.85))
}

const clearPending = (): void => {
  if (pendingUrl.value) URL.revokeObjectURL(pendingUrl.value)
  pendingImage.value = undefined
  pendingUrl.value = undefined
}

const onPick = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = ''
  if (!file.type.startsWith('image/')) {
    error.value = '이미지 파일을 골라 주세요.'
    return
  }
  try {
    const image = await resizeToSquare(file)
    clearPending()
    pendingImage.value = image
    pendingUrl.value = URL.createObjectURL(image)
  } catch {
    error.value = '이미지를 읽지 못했어요. 다른 파일을 골라 주세요.'
  }
}

const useDefaultAvatar = (): void => {
  clearPending()
  avatarPath.value = undefined
}

const cancel = async (groupId: string): Promise<void> => {
  busyId.value = groupId
  cancelError.value = (await group.cancelJoin(groupId)) ?? ''
  busyId.value = ''
}

const submit = async (): Promise<void> => {
  const name = nickname.value.trim()
  if (!name) {
    error.value = '닉네임을 입력해 주세요.'
    return
  }
  busy.value = true
  let avatar = avatarPath.value
  if (pendingImage.value) {
    const uploaded = await auth.uploadAvatar(pendingImage.value)
    if (uploaded.error) {
      error.value = uploaded.error
      busy.value = false
      return
    }
    avatar = uploaded.path
  }
  error.value = (await auth.saveProfile({ nickname: name, greeting: greeting.value.trim(), avatar })) ?? ''
  busy.value = false
  if (!error.value) await navigateTo(typeof previous === 'string' && previous !== '/profile' ? previous : '/')
}

if (!isFirst && !group.loaded) await group.loadGroups()

onBeforeUnmount(clearPending)
</script>

<style scoped lang="scss">
.profile {
  max-width: 440px;
  margin: 0 auto;
}

.avatar-field {
  margin: 0 0 var(--space-4);
  padding: 0;
  border: 0;

  legend {
    padding: 0;
    margin-bottom: var(--space-2);
    font-size: 14px;
    font-weight: 600;
  }
}

.avatar-preview {
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  margin: 0 auto var(--space-3);
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-primary-soft);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-default {
  width: 44px;
  height: 44px;
}

.avatar-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}

.optional {
  color: var(--color-text-subtle);
  font-weight: 400;
}

.submit {
  width: 100%;
  margin-top: var(--space-3);
  transition: transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1);

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
}

.section-title {
  margin: var(--space-5) 0 var(--space-2);
  font-size: 15px;
}

.meta {
  color: var(--color-text-muted);
  font-size: 13px;
}

.groups {
  display: grid;
  gap: var(--space-2);
  margin: 0 0 var(--space-3);
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
  min-height: 56px;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius);
  color: inherit;
  text-decoration: none;
  transition: background-color 160ms ease;

  &:not(.static):hover {
    background: var(--color-surface-muted);
  }
}

.group-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.chevron {
  color: var(--color-text-subtle);
  font-size: 22px;
}

.pending {
  display: flex;
  align-items: center;
  gap: var(--space-2);
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

.find {
  width: 100%;
}
</style>
