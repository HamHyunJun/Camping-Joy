<template>
  <section>
    <div class="hero">
      <div>
        <h1 class="page-title">전체 캠핑</h1>
        <p class="hero-desc">모임의 캠핑을 함께 보고, 누가 무엇을 챙길지 정리해요.</p>
      </div>
      <button v-if="camps.length" class="btn btn-primary" type="button" @click="startNewCamp">+ 새 캠핑</button>
    </div>

    <NuxtLink to="/gear" class="card gear-link">
      <span class="avatar gear-icon"><img :src="tentIcon" alt="" width="20" height="20" /></span>
      <span class="gear-text">
        <strong>멤버·장비 등록</strong>
        <span class="meta">
          {{
            gear.people.length
              ? `${gear.people.length}명 · 장비 ${gearCount}종 등록됨`
              : '캠핑 전에 사람별 장비를 먼저 등록해 두세요'
          }}
        </span>
      </span>
      <span class="chevron" aria-hidden="true">›</span>
    </NuxtLink>

    <!-- 나는 누구? (이 기기에만 기억) -->
    <div v-if="gear.people.length" ref="mePicker" class="me-picker" @keydown.esc="choosingMe = false">
      <button
        type="button"
        class="card me-trigger"
        :class="{ open: choosingMe }"
        aria-haspopup="listbox"
        :aria-expanded="choosingMe"
        @click="choosingMe = !choosingMe"
      >
        <span class="avatar" :class="{ unknown: !me }">{{ me ? me.name.slice(0, 1) : '?' }}</span>
        <span class="me-text">
          <strong>{{ me ? `나는 ${me.name}` : '내 이름 고르기' }}</strong>
          <small>{{ me ? '내가 참여한 캠핑을 따로 모아 보여 줘요' : '고르면 내 캠핑을 따로 모아 볼 수 있어요' }}</small>
        </span>
        <span class="chevron down" :class="{ open: choosingMe }" aria-hidden="true">›</span>
      </button>
      <ul v-if="choosingMe" class="me-options" role="listbox" aria-label="내 이름">
        <li v-for="person in gear.people" :key="person.id">
          <button
            type="button"
            role="option"
            class="me-option"
            :class="{ selected: person.id === store.meId }"
            :aria-selected="person.id === store.meId"
            @click="chooseMe(person.id)"
          >
            <span class="avatar small">{{ person.name.slice(0, 1) }}</span>
            <span class="option-name">{{ person.name }}</span>
            <span v-if="person.id === store.meId" class="check" aria-hidden="true">✓</span>
          </button>
        </li>
        <li v-if="me" class="clear-row">
          <button type="button" class="me-option clear" @click="chooseMe(null)">선택 안 함</button>
        </li>
      </ul>
    </div>

    <template v-if="camps.length">
      <section v-for="section in sections" :key="section.key" class="camp-section">
        <h2 class="section-title list-title">{{ section.title }}</h2>
        <p v-if="!section.items.length" class="empty">{{ section.empty }}</p>
        <ul v-else class="camp-list">
          <CampListItem v-for="camp in section.items" :key="camp.id" :camp="camp" />
        </ul>
      </section>
    </template>
    <div v-else class="empty empty-camps">
      <img :src="tentIcon" alt="" width="40" height="40" />
      <strong>{{ store.pastCamps.length ? '다가올 캠핑이 없어요' : '아직 캠핑이 없어요' }}</strong>
      <span>새 캠핑을 만들어 준비를 시작해 보세요.</span>
      <button class="btn btn-primary" type="button" @click="startNewCamp">+ 새 캠핑 만들기</button>
    </div>

    <NuxtLink v-if="store.pastCamps.length" to="/camps/past" class="card past-link">
      <span class="past-text">
        <strong>지난 캠핑</strong>
        <span class="meta">다녀온 캠핑 {{ store.pastCamps.length }}개</span>
      </span>
      <span class="chevron" aria-hidden="true">›</span>
    </NuxtLink>
  </section>
</template>

<script setup lang="ts">
import tentIcon from '~/assets/icons/tent.svg'

const store = useCampStore()
const gear = useGearStore()

// 정보를 입력하지 않고 나온 빈 캠핑은 목록에 남기지 않는다.
store.removeEmptyDrafts()

const gearCount = computed(() => gear.people.reduce((sum, p) => sum + p.equipments.length, 0))

// 지난 캠핑은 '지난 캠핑' 페이지에서 따로 본다.
const camps = computed(() => store.upcomingCamps)

// 이 기기를 쓰는 사람. 고르면 그 사람이 멤버인 캠핑을 따로 모아 보여 준다.
const me = computed(() => (store.meId ? gear.findPerson(store.meId) ?? null : null))
const choosingMe = ref(false)
const myCamps = computed(() => (me.value ? camps.value.filter((camp) => camp.members.some((m) => m.id === me.value?.id)) : []))
// 내 캠핑을 골랐으면 아래 목록에서는 빼서 같은 캠핑이 두 번 보이지 않게 한다.
const otherCamps = computed(() => camps.value.filter((camp) => !myCamps.value.includes(camp)))
const sections = computed(() => {
  if (!me.value) return [{ key: 'all', title: `다가올 캠핑 ${camps.value.length}개`, items: camps.value, empty: '' }]
  return [
    { key: 'mine', title: `내가 참여한 캠핑 ${myCamps.value.length}개`, items: myCamps.value, empty: '아직 참여한 캠핑이 없어요.' },
    ...(otherCamps.value.length ? [{ key: 'others', title: `다른 캠핑 ${otherCamps.value.length}개`, items: otherCamps.value, empty: '' }] : []),
  ]
})

function chooseMe(personId: string | null) {
  store.meId = personId
  choosingMe.value = false
}

// 이름 목록 밖을 누르면 닫는다.
const mePicker = ref<HTMLElement | null>(null)
function closeOnOutside(event: PointerEvent) {
  if (choosingMe.value && !mePicker.value?.contains(event.target as Node)) choosingMe.value = false
}
onMounted(() => document.addEventListener('pointerdown', closeOnOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOnOutside))

function startNewCamp() {
  const campId = store.createCamp()
  navigateTo(`/camps/${campId}/info`)
}
</script>

<style scoped lang="scss">
.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-5);

  .page-title {
    margin-bottom: 0;
  }
}

.hero-desc {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.gear-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  text-decoration: none;

  &:hover {
    border-color: var(--color-primary);
  }
}

.gear-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.gear-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.chevron {
  color: var(--color-text-subtle);
  font-size: 24px;
}

.me-picker {
  position: relative;
  z-index: 5;
  margin-bottom: var(--space-6);
}

.me-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover,
  &.open {
    border-color: var(--color-primary);
  }

  .avatar.unknown {
    background: var(--color-surface-muted);
    color: var(--color-text-subtle);
  }
}

.me-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;

  strong {
    font-size: 16px;
  }

  small {
    color: var(--color-text-muted);
    font-size: 13px;
  }
}

.chevron.down {
  line-height: 1;
  transform: rotate(90deg);
  transition: transform 0.15s;

  &.open {
    transform: rotate(-90deg);
  }
}

.me-options {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  max-height: 300px;
  margin: 0;
  padding: var(--space-1);
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  list-style: none;
}

.me-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 48px;
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--color-surface-muted);
  }

  &.selected {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-weight: 700;
  }

  &.clear {
    justify-content: center;
    color: var(--color-text-muted);
    font-size: 14px;
  }
}

.avatar.small {
  width: 32px;
  height: 32px;
  font-size: 14px;
}

.option-name {
  flex: 1;
}

.check {
  font-weight: 700;
}

.clear-row {
  margin-top: var(--space-1);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-1);
}

.camp-section + .camp-section {
  margin-top: var(--space-8);
}

.list-title {
  margin-bottom: var(--space-3);
  color: var(--color-text-muted);
  font-size: 14px;
}

.camp-list {
  display: grid;
  // 칸이 긴 캠핑 이름만큼 넓어져 화면 밖으로 나가지 않게 한다.
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;

  @include pc {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.meta {
  color: var(--color-text-muted);
  font-size: 14px;
}

.past-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-8);
  text-decoration: none;

  &:hover {
    border-color: var(--color-primary);
  }
}

.past-text {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.empty-camps {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-surface);

  strong {
    color: var(--color-text);
    font-size: 16px;
  }

  .btn {
    margin-top: var(--space-2);
  }
}
</style>
