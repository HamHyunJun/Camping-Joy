<template>
  <section>
    <div class="hero">
      <div>
        <h1 class="page-title">전체 캠핑</h1>
        <p class="hero-desc">모임의 캠핑을 함께 보고, 누가 무엇을 챙길지 정리해요.</p>
      </div>
      <button class="btn btn-primary" type="button" @click="startNewCamp">+ 새 캠핑</button>
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
    <div v-if="gear.people.length" class="card me-box">
      <template v-if="me && !choosingMe">
        <span class="avatar">{{ me.name.slice(0, 1) }}</span>
        <span class="me-text">나는 <b>{{ me.name }}</b></span>
        <button class="btn btn-text" type="button" @click="choosingMe = true">바꾸기</button>
      </template>
      <template v-else>
        <label class="me-text" for="me-select">내 이름을 고르면 내가 참여한 캠핑을 따로 볼 수 있어요.</label>
        <select id="me-select" class="input me-select" :value="store.meId ?? ''" @change="chooseMe">
          <option value="">이름 고르기</option>
          <option v-for="person in gear.people" :key="person.id" :value="person.id">{{ person.name }}</option>
        </select>
      </template>
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
const sections = computed(() => [
  ...(me.value ? [{ key: 'mine', title: `내가 참여한 캠핑 ${myCamps.value.length}개`, items: myCamps.value, empty: '아직 참여한 캠핑이 없어요.' }] : []),
  { key: 'all', title: `다가올 캠핑 ${camps.value.length}개`, items: camps.value, empty: '' },
])

function chooseMe(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  store.meId = value || null
  choosingMe.value = false
}

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

.me-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  margin-bottom: var(--space-6);
}

.me-text {
  flex: 1;
  font-size: 15px;
}

label.me-text {
  flex-basis: 100%;
  color: var(--color-text-muted);
  font-size: 14px;
}

.me-select {
  flex: 1;
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
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;

  @include pc {
    grid-template-columns: 1fr 1fr;
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
