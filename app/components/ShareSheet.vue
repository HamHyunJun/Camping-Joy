<script setup lang="ts">
import { toBlob } from 'html-to-image'
import tentIcon from '~/assets/icons/tent.svg'
import type { Camp } from '~/types/camp'

const props = defineProps<{ camp: Camp }>()
const emit = defineEmits<{ close: [] }>()

const mode = ref<'image' | 'text'>('image')
const card = ref<HTMLElement | null>(null)
const busy = ref(false)
const toast = ref('')

const text = computed(() => buildShareText(props.camp))
const dday = computed(() => formatDday(props.camp.date))
// 한글 파일 이름을 'download'로 바꿔 버리는 브라우저가 있어 영문으로 짓는다.
const fileName = computed(() => `camping-joy-${props.camp.date}`)
const total = computed(() => props.camp.members.reduce((sum, m) => sum + m.equipments.reduce((s, e) => s + e.quantity, 0), 0))

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

function showToast(message: string) {
  toast.value = message
  setTimeout(() => (toast.value = ''), 1800)
}

async function makeImage(): Promise<Blob | null> {
  if (!card.value) return null
  // 화면 밀도와 상관없이 메신저에서 선명하게 보이도록 2배로 그린다.
  return toBlob(card.value, { pixelRatio: 2, backgroundColor: '#f3f5f1' })
}

function download(blob: Blob, name: string) {
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
function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function saveImage() {
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

async function shareImage() {
  busy.value = true
  try {
    const blob = await makeImage()
    if (!blob) return
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

async function copyText() {
  try {
    await navigator.clipboard.writeText(text.value)
    showToast('복사했어요.')
  } catch {
    showToast('복사하지 못했어요. 텍스트를 길게 눌러 복사해 주세요.')
  }
}

async function shareText() {
  try {
    await navigator.share({ text: text.value })
  } catch (error) {
    if (!isAbort(error)) showToast('공유하지 못했어요.')
  }
}

function saveText() {
  download(new Blob([text.value], { type: 'text/plain;charset=utf-8' }), `${fileName.value}.txt`)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <div class="sheet" role="dialog" aria-modal="true" aria-label="결과 공유">
      <header class="sheet-head">
        <h2>결과 공유</h2>
        <button class="btn btn-text" type="button" @click="emit('close')">닫기</button>
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
              {{ formatDate(camp.date) }}
              <span v-if="dday" class="share-dday">{{ dday }}</span>
            </span>
            <span class="share-stats">멤버 {{ camp.members.length }}명 · 장비 {{ total }}개</span>
          </div>
          <ul class="share-members">
            <li v-for="member in camp.members" :key="member.id">
              <div class="share-member">
                <span class="share-avatar">{{ member.name.slice(0, 1) }}</span>
                <strong>{{ member.name }}</strong>
                <small>{{ member.equipments.reduce((s, e) => s + e.quantity, 0) }}개</small>
              </div>
              <div class="share-items">
                <span v-for="item in sortByCategory(member.equipments)" :key="item.id" class="share-item">
                  {{ equipmentLabel(item) }}<b v-if="item.quantity > 1"> ×{{ item.quantity }}</b>
                </span>
                <span v-if="!member.equipments.length" class="share-none">챙길 장비 없음</span>
              </div>
            </li>
          </ul>
        </div>
        <pre v-show="mode === 'text'" class="share-text">{{ text }}</pre>
      </div>

      <div v-if="mode === 'image'" class="actions">
        <button class="btn" type="button" :disabled="busy" @click="saveImage">이미지 저장</button>
        <button v-if="canShare" class="btn btn-primary" type="button" :disabled="busy" @click="shareImage">이미지 공유</button>
      </div>
      <div v-else class="actions">
        <button class="btn" type="button" @click="saveText">파일 저장</button>
        <button class="btn" :class="{ 'btn-primary': !canShare }" type="button" @click="copyText">복사</button>
        <button v-if="canShare" class="btn btn-primary" type="button" @click="shareText">공유</button>
      </div>

      <p v-if="toast" class="toast" role="status">{{ toast }}</p>
    </div>
  </div>
</template>

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

  @include mobile {
    max-width: none;
    padding-bottom: calc(var(--space-4) + var(--safe-bottom));
    border-radius: var(--radius) var(--radius) 0 0;
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
