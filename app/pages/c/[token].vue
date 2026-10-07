<script setup lang="ts">
import type { SharedCamp, SharedMember } from '~/types/camp'

// 캠핑 링크로 들어온 화면. 로그인 없이 캠핑을 보고, "나는 누구?"에서 자기 이름을 고른다.
const route = useRoute()
const store = useCampStore()
const sharing = useCampSharing()

const token = computed(() => String(route.params.token ?? ''))
const camp = ref<SharedCamp | null>(null)
const state = ref<'loading' | 'ready' | 'notFound' | 'error'>('loading')
const claiming = ref(false)
const changing = ref(false)

const me = computed(() => camp.value?.members.find((m) => m.mine) ?? null)
const dday = computed(() => (camp.value ? formatDday(camp.value.date) : ''))
const allItems = computed(() => camp.value?.members.flatMap((m) => m.items) ?? [])
const readyCount = computed(() => allItems.value.filter((item) => item.ready).length)
/** 내가 만든 캠핑이고 이 기기에 원본이 있으면 바로 고칠 수 있게 연결한다. */
const localCamp = computed(() => (camp.value ? store.camps.find((c) => c.id === camp.value?.id) ?? null : null))

async function load() {
  if (!sharing.enabled) {
    state.value = 'error'
    return
  }
  try {
    const loaded = await sharing.loadSharedCamp(token.value)
    if (!loaded) {
      state.value = 'notFound'
      return
    }
    camp.value = loaded
    state.value = 'ready'
    if (!loaded.isOwner) {
      store.rememberJoined({
        token: token.value,
        name: loaded.name,
        date: loaded.date,
        memberName: loaded.members.find((m) => m.mine)?.name,
      })
    }
  } catch {
    if (!camp.value) state.value = 'error'
  }
}

async function claim(member: SharedMember | null) {
  if (!camp.value) return
  claiming.value = true
  try {
    await sharing.claimMember(camp.value.id, member?.id ?? null)
    changing.value = false
  } catch {
    alert('다른 사람이 먼저 고른 이름이에요. 다시 골라 주세요.')
  } finally {
    claiming.value = false
    await load()
  }
}

function memberTotal(member: SharedMember): number {
  return member.items.reduce((sum, item) => sum + item.quantity, 0)
}

// 다른 사람이 고친 내용을 보려고, 화면으로 돌아올 때마다 다시 불러온다.
function onVisible() {
  if (document.visibilityState === 'visible' && state.value === 'ready') load()
}
onMounted(() => {
  load()
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisible))
</script>

<template>
  <section>
    <p v-if="state === 'loading'" class="empty">캠핑을 불러오는 중이에요…</p>

    <div v-else-if="state === 'notFound'" class="empty">
      <p>링크가 올바르지 않거나, 캠핑을 만든 사람이 링크를 바꿨어요.</p>
      <p>새 링크를 다시 받아 주세요.</p>
      <NuxtLink class="btn" to="/">내 캠핑으로</NuxtLink>
    </div>

    <div v-else-if="state === 'error' || !camp" class="empty">
      <p>캠핑을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>
      <button class="btn" type="button" @click="load">다시 시도</button>
    </div>

    <template v-else>
      <!-- 캠핑 정보 -->
      <article class="card summary">
        <span class="shared-label">공유받은 캠핑</span>
        <h1 class="camp-name">
          {{ camp.name }}
          <span v-if="dday" class="dday" :class="{ past: dday === '지난 캠핑' }">{{ dday }}</span>
        </h1>
        <p class="camp-date">{{ formatDate(camp.date) }} · 멤버 {{ camp.members.length }}명</p>
        <div class="ready-row">
          <span class="bar"><span :style="{ width: allItems.length ? `${(readyCount / allItems.length) * 100}%` : '0%' }" /></span>
          <span class="ratio">준비 {{ readyCount }}/{{ allItems.length }}</span>
        </div>
      </article>

      <!-- 만든 사람 -->
      <p v-if="camp.isOwner" class="notice">
        내가 만든 캠핑이에요.
        <NuxtLink v-if="localCamp" :to="`/camps/${camp.id}/result`">캠핑 고치러 가기</NuxtLink>
      </p>

      <!-- 나는 누구? -->
      <section v-else class="card who">
        <template v-if="me && !changing">
          <div class="who-me">
            <span class="avatar">{{ me.name.slice(0, 1) }}</span>
            <span>나는 <b>{{ me.name }}</b></span>
          </div>
          <button class="btn btn-text" type="button" @click="changing = true">바꾸기</button>
        </template>
        <template v-else>
          <h2 class="section-title">나는 누구?</h2>
          <p class="who-desc">이름을 고르면 내가 챙길 장비를 먼저 보여 줘요. 이 기기에서만 기억해요.</p>
          <div class="who-chips">
            <button
              v-for="member in camp.members"
              :key="member.id"
              class="chip"
              :class="{ selected: member.mine }"
              type="button"
              :disabled="claiming || member.claimed"
              @click="claim(member)"
            >
              {{ member.name }}<small v-if="member.claimed">선택됨</small>
            </button>
          </div>
          <div v-if="me" class="who-actions">
            <button class="btn btn-text" type="button" :disabled="claiming" @click="claim(null)">선택 안 함</button>
            <button class="btn btn-text" type="button" @click="changing = false">취소</button>
          </div>
        </template>
      </section>

      <!-- 내가 챙길 장비 -->
      <section v-if="me" class="block">
        <h2 class="section-title">내가 챙길 장비 <small>{{ memberTotal(me) }}개</small></h2>
        <ul v-if="me.items.length" class="card item-list">
          <li v-for="item in sortByCategory(me.items)" :key="item.id" :class="{ ready: item.ready }">
            <span>{{ equipmentLabel(item) }}</span>
            <span class="qty">×{{ item.quantity }}</span>
            <span class="state">{{ item.ready ? '준비 완료' : '준비 전' }}</span>
          </li>
        </ul>
        <p v-else class="empty">챙길 장비가 없어요.</p>
      </section>

      <!-- 모두의 장비 -->
      <section class="block">
        <h2 class="section-title">누가 무엇을 챙기나요</h2>
        <ul class="member-list">
          <li v-for="member in camp.members" :key="member.id" class="card member" :class="{ mine: member.mine }">
            <div class="member-head">
              <span class="avatar">{{ member.name.slice(0, 1) }}</span>
              <strong>{{ member.name }}</strong>
              <small>{{ memberTotal(member) }}개</small>
            </div>
            <div class="chips">
              <span v-for="item in sortByCategory(member.items)" :key="item.id" class="item-chip" :class="{ ready: item.ready }">
                <span v-if="item.ready" aria-label="준비 완료">✓</span>
                {{ equipmentLabel(item) }}<b v-if="item.quantity > 1"> ×{{ item.quantity }}</b>
              </span>
              <span v-if="!member.items.length" class="none">챙길 장비 없음</span>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>

<style scoped lang="scss">
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-6);

  p {
    margin: 0;
  }
}

.summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: var(--space-2) 0 var(--space-4);
}

.shared-label {
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
}

.camp-name {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.dday {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
  font-size: 12px;
  font-weight: 700;

  &.past {
    background: var(--color-surface-muted);
    color: var(--color-text-muted);
  }
}

.camp-date {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.ready-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.bar {
  flex: 1;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-border);

  span {
    display: block;
    height: 100%;
    background: var(--color-primary);
  }
}

.ratio {
  color: var(--color-text-muted);
  font-size: 13px;
}

.who {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.who-me {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.who-desc {
  flex-basis: 100%;
  margin: 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.who-chips {
  display: flex;
  flex-basis: 100%;
  flex-wrap: wrap;
  gap: var(--space-2);

  .chip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .chip.selected {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.who-actions {
  display: flex;
  gap: var(--space-1);
}

.block {
  margin-bottom: var(--space-6);

  .section-title {
    margin-bottom: var(--space-3);

    small {
      color: var(--color-text-muted);
      font-size: 14px;
      font-weight: 500;
    }
  }
}

.item-list {
  margin: 0;
  padding: var(--space-1) var(--space-4);
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) 0;

    & + li {
      border-top: 1px solid var(--color-border);
    }

    span:first-child {
      flex: 1;
    }
  }

  .qty {
    color: var(--color-text-muted);
    font-size: 14px;
  }

  .state {
    min-width: 64px;
    color: var(--color-text-muted);
    font-size: 13px;
    text-align: right;
  }

  .ready .state {
    color: var(--color-primary);
    font-weight: 700;
  }
}

.member-list {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;

  @include pc {
    grid-template-columns: repeat(2, 1fr);
  }
}

.member.mine {
  border-color: var(--color-primary);
}

.member-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);

  small {
    color: var(--color-text-muted);
  }
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.item-chip {
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 14px;

  &.ready {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
    color: var(--color-primary-strong);
  }
}

.none {
  color: var(--color-text-muted);
  font-size: 14px;
}
</style>
