<template>
  <div class="backdrop" :class="{ closing }" @click.self="requestClose">
    <div class="sheet" role="dialog" aria-modal="true" aria-label="결과 공유" @animationend.self="onSheetAnimationEnd">
      <header class="sheet-head">
        <h2>결과 공유</h2>
        <button class="icon-close" type="button" aria-label="닫기" @click="requestClose" />
      </header>

      <div class="tabs" role="tablist">
        <button type="button" role="tab" :aria-selected="mode === 'image'" @click="mode = 'image'">이미지</button>
        <button type="button" role="tab" :aria-selected="mode === 'text'" @click="mode = 'text'">텍스트</button>
      </div>

      <div class="preview">
        <!-- 이미지로 저장되는 카드. 한 화면에 들어오도록 멤버별로 장비를 칩으로 모은다. -->
        <div v-show="mode === 'image'" ref="card" class="share-card">
          <div class="share-top">
            <span class="brand"><img :src="tentIcon" alt="" width="14" height="14" /> Camping&amp;Joy</span>
            <strong class="share-name">{{ camp.name || '이름 없는 캠핑' }}</strong>
            <span class="share-date">
              {{ format.formatDate(camp.date) }}
              <span v-if="dday" class="share-dday">{{ dday }}</span>
            </span>
            <span class="share-stats">멤버 {{ camp.members.length }}명 · 장비 {{ total }}개</span>
          </div>
          <div v-if="schedule.length" class="share-schedule">
            <div v-for="group in schedule" :key="group.day">
              <small v-if="schedule.length > 1 || group.day > 1">{{ group.day }}일차 · {{ format.formatDayDate(camp.date, group.day) }}</small>
              <p v-for="item in group.items" :key="item.id"><b>{{ item.time }}</b> {{ item.title }}</p>
            </div>
          </div>
          <div v-if="menus.length || camp.shopping?.length" class="share-schedule">
            <div v-for="group in menus" :key="group.day">
              <small>{{ group.day }}일차 음식</small>
              <p v-for="meal in group.items" :key="meal.id"><b>{{ meal.type }}</b> {{ meal.menu }}</p>
            </div>
            <div v-if="camp.shopping?.length">
              <small>장볼 것</small>
              <p>{{ camp.shopping.map((s) => s.name).join(', ') }}</p>
            </div>
          </div>
          <ul class="share-members">
            <li v-for="member in camp.members" :key="member.id">
              <div class="share-member">
                <span class="share-avatar">{{ member.name.slice(0, 1) }}</span>
                <strong>{{ member.name }}</strong>
                <small>{{ member.equipments.reduce((s, e) => s + e.quantity, 0) }}개</small>
              </div>
              <div class="share-items">
                <span v-for="item in shareTextUtil.sortByCategory(member.equipments)" :key="item.id" class="share-item">
                  {{ equipmentLabel.equipmentLabel(item) }}<b v-if="item.quantity > 1"> ×{{ item.quantity }}</b>
                </span>
                <span v-if="!member.equipments.length" class="share-none">챙길 장비 없음</span>
              </div>
            </li>
          </ul>
        </div>
        <pre v-show="mode === 'text'" class="share-text">{{ text }}</pre>
      </div>

      <div v-if="mode === 'image'" class="actions">
        <button v-if="!native" class="btn" type="button" :disabled="busy" @click="saveImage">이미지 저장</button>
        <button v-if="canShare" class="btn btn-primary" type="button" :disabled="busy" @click="shareImage">이미지 공유</button>
      </div>
      <div v-else class="actions">
        <button v-if="!native" class="btn" type="button" @click="saveText">파일 저장</button>
        <button class="btn" :class="{ 'btn-primary': !canShare }" type="button" @click="copyText">복사</button>
        <button v-if="canShare" class="btn btn-primary" type="button" @click="shareText">공유</button>
      </div>

      <p v-if="toast" class="toast" role="status">{{ toast }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { toBlob } from 'html-to-image'
import tentIcon from '~/assets/icons/tent.svg'
import type { Camp } from '~/types/camp'
import equipmentLabel from '~/utils/equipmentLabel'
import format from '~/utils/format'
import shareTextUtil from '~/utils/shareText'

const props = defineProps<{ camp: Camp }>()
const emit = defineEmits<{ close: [] }>()

const mode = ref<'image' | 'text'>('image')
const card = ref<HTMLElement>()
const busy = ref(false)
const toast = ref('')
const closing = ref(false)
/** 안드로이드/iOS 앱(웹뷰) 안인지. 웹뷰는 다운로드 링크와 Web Share를 못 쓰므로 앱 공유 창을 쓴다. */
const native = Capacitor.isNativePlatform()
const canShare = native || (typeof navigator !== 'undefined' && typeof navigator.share === 'function')

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

const text = computed(() => shareTextUtil.buildShareText(props.camp))
const dday = computed(() => format.formatDday(props.camp.date))
const schedule = computed(() => format.scheduleGroups(format.sortSchedule(props.camp.schedule ?? [])))
const menus = computed(() => format.scheduleGroups(format.sortMeals((props.camp.menus ?? []).filter((m) => m.menu))))
// 한글 파일 이름을 'download'로 바꿔 버리는 브라우저가 있어 영문으로 짓는다.
const fileName = computed(() => `camping-joy-${props.camp.date}`)
const total = computed(() => props.camp.members.reduce((sum, m) => sum + m.equipments.reduce((s, e) => s + e.quantity, 0), 0))

const showToast = (message: string): void => {
  toast.value = message
  setTimeout(() => (toast.value = ''), 1800)
}

const makeImage = async (): Promise<Blob | undefined> => {
  if (!card.value) return undefined
  // 화면 밀도와 상관없이 메신저에서 선명하게 보이도록 2배로 그린다.
  return (await toBlob(card.value, { pixelRatio: 2, backgroundColor: '#f3f5f1' })) ?? undefined
}

const download = (blob: Blob, name: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 공유 창을 닫은 경우는 실패가 아니다. */
const isAbort = (error: unknown): boolean => {
  if (error instanceof DOMException) return error.name === 'AbortError'
  return error instanceof Error && /cancel/i.test(error.message)
}

const toBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

/** 앱에서는 이미지를 캐시에 써 두고 휴대폰 공유 창으로 넘긴다. 공유 창에서 저장도 할 수 있다. */
const shareFileNative = async (blob: Blob, name: string): Promise<void> => {
  const { uri } = await Filesystem.writeFile({ path: name, data: await toBase64(blob), directory: Directory.Cache })
  await Share.share({ files: [uri], title: props.camp.name })
}

const saveImage = async (): Promise<void> => {
  busy.value = true
  try {
    const blob = await makeImage()
    if (blob) download(blob, `${fileName.value}.png`)
  } catch {
    showToast('이미지를 만들지 못했어요.')
  } finally {
    busy.value = false
  }
}

const shareImage = async (): Promise<void> => {
  busy.value = true
  try {
    const blob = await makeImage()
    if (!blob) return
    if (native) {
      await shareFileNative(blob, `${fileName.value}.png`)
      return
    }
    const file = new File([blob], `${fileName.value}.png`, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: props.camp.name })
    } else {
      // 파일 공유를 못 하는 브라우저는 저장으로 대신한다.
      download(blob, file.name)
      showToast('공유를 지원하지 않아 이미지로 저장했어요.')
    }
  } catch (error) {
    if (!isAbort(error)) showToast('공유하지 못했어요.')
  } finally {
    busy.value = false
  }
}

const copyText = async (): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text.value)
    showToast('복사했어요.')
  } catch {
    showToast('복사하지 못했어요. 텍스트를 길게 눌러 복사해 주세요.')
  }
}

const shareText = async (): Promise<void> => {
  try {
    if (native) await Share.share({ text: text.value })
    else await navigator.share({ text: text.value })
  } catch (error) {
    if (!isAbort(error)) showToast('공유하지 못했어요.')
  }
}

const saveText = (): void => {
  download(new Blob([text.value], { type: 'text/plain;charset=utf-8' }), `${fileName.value}.txt`)
}

// 닫을 때는 퇴장 애니메이션이 끝난 뒤 부모에 알린다. 애니메이션을 줄인 환경에서는 바로 알린다.
const requestClose = (): void => {
  if (closing.value) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) emit('close')
  else closing.value = true
}

const onSheetAnimationEnd = (): void => {
  if (closing.value) emit('close')
}

const onKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape') requestClose()
}
</script>

<style scoped lang="scss">
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background: rgb(16 24 20 / 45%);
  animation: backdrop-in 200ms ease;

  &.closing {
    animation: backdrop-out 200ms ease forwards;
  }

  @include mobile {
    align-items: flex-end;
    padding: 0;
  }
}

.sheet {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  max-width: 440px;
  max-height: 90dvh;
  padding: var(--space-4);
  border-radius: var(--radius);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  animation: pop-in 220ms cubic-bezier(0.34, 1.56, 0.64, 1);

  .closing > & {
    animation: pop-out 160ms ease forwards;
  }

  @include mobile {
    max-width: none;
    padding-bottom: calc(var(--space-4) + var(--safe-bottom));
    border-radius: var(--radius) var(--radius) 0 0;
    animation: slide-in 280ms cubic-bezier(0.32, 0.72, 0, 1);

    .closing > & {
      animation: slide-out 220ms cubic-bezier(0.32, 0.72, 0, 1) forwards;
    }
  }
}

@keyframes backdrop-in {
  from {
    opacity: 0;
  }
}

@keyframes backdrop-out {
  to {
    opacity: 0;
  }
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
}

@keyframes pop-out {
  to {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
}

@keyframes slide-in {
  from {
    transform: translateY(100%);
  }
}

@keyframes slide-out {
  to {
    transform: translateY(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .backdrop,
  .sheet {
    animation: none;
  }
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font-size: 18px;
  }
}

.tabs {
  display: flex;
  padding: 3px;
  border-radius: 999px;
  background: var(--color-border);

  button {
    flex: 1;
    min-height: 34px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--color-text-muted);
    font: inherit;
    font-weight: 600;
    cursor: pointer;

    &[aria-selected='true'] {
      background: var(--color-surface);
      color: var(--color-text);
      box-shadow: var(--shadow-sm);
    }
  }
}

.preview {
  overflow-y: auto;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
}

.actions {
  display: flex;
  gap: var(--space-2);

  .btn {
    flex: 1;
  }
}

.toast {
  position: absolute;
  bottom: calc(100% + var(--space-2));
  left: 50%;
  margin: 0;
  padding: var(--space-2) var(--space-4);
  border-radius: 999px;
  background: rgb(31 42 36 / 90%);
  color: #fff;
  font-size: 14px;
  white-space: nowrap;
  transform: translateX(-50%);

  @include mobile {
    bottom: auto;
    top: calc(-1 * var(--space-8) - var(--space-4));
  }
}

.share-text {
  margin: 0;
  padding: var(--space-4);
  font: inherit;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: keep-all;
  user-select: text;
}

/* 이미지 카드: 그대로 PNG가 되므로 전역 클래스에 기대지 않고 여기서 모두 정한다. */
.share-card {
  padding: 16px;
  background: #f3f5f1;
  color: #1f2a24;
  font-family: system-ui, -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
}

.share-top {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px;
  border-radius: 14px;
  background: #2f6b4f;
  color: #fff;
}

.brand {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  opacity: 0.85;

  img {
    filter: brightness(0) invert(1);
  }
}

.share-name {
  font-size: 20px;
  letter-spacing: -0.02em;
}

.share-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.share-dday {
  padding: 0 8px;
  border-radius: 999px;
  background: #fbeedf;
  color: #d9822b;
  font-size: 12px;
  font-weight: 700;
}

.share-stats {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.85;
}

.share-schedule {
  display: grid;
  gap: 6px;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--color-surface-muted);
  font-size: 13px;

  small {
    display: block;
    margin-bottom: 2px;
    color: var(--color-text-muted);
    font-size: 11px;
    font-weight: 700;
  }

  p {
    margin: 0;
  }

  b {
    display: inline-block;
    width: 40px;
    color: var(--color-primary);
  }
}

.share-members {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;

  li {
    padding: 12px;
    border: 1px solid #e2e7e1;
    border-radius: 12px;
    background: #fff;
  }
}

.share-member {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  small {
    margin-left: auto;
    color: #6b766f;
    font-size: 13px;
  }
}

.share-avatar {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e6f0ea;
  color: #2f6b4f;
  font-size: 13px;
  font-weight: 700;
}

.share-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.share-item {
  padding: 3px 10px;
  border-radius: 999px;
  background: #f3f5f1;
  font-size: 13px;

  b {
    color: #2f6b4f;
  }
}

.share-none {
  color: #9aa39d;
  font-size: 13px;
}
</style>
