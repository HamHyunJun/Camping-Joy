<template>
  <section>
    <h1 class="page-title">캠핑 정보</h1>
    <p class="page-desc">어디로, 언제 떠나는지 알려주세요.</p>

    <form class="card" novalidate @submit.prevent="save">
      <div class="field">
        <label for="camp-name">캠핑명</label>
        <input
          id="camp-name"
          v-model="form.name"
          class="input"
          type="text"
          placeholder="예: 10월 가평 캠핑"
          maxlength="50"
          autocomplete="off"
        />
        <span v-if="submitted && nameError" class="field-error">{{ nameError }}</span>
      </div>

      <fieldset class="field place">
        <legend>캠핑장</legend>
        <input
          v-model="form.place.name"
          class="input"
          type="text"
          placeholder="캠핑장 이름 (예: 가평 자라섬 캠핑장)"
          maxlength="50"
          autocomplete="off"
          aria-label="캠핑장 이름"
        />
        <input
          v-model="form.place.address"
          class="input"
          type="text"
          placeholder="주소 (예: 경기 가평군 가평읍 달전리 1-1)"
          maxlength="100"
          autocomplete="off"
          aria-label="캠핑장 주소"
          @change="mapPlace = { ...form.place }"
        />
        <!-- 캠핑장 이름으로 네이버 지도를 열어 주소를 복사해 올 수 있게 한다 -->
        <button v-if="form.place.name.trim() && !form.place.address.trim()" class="btn btn-text find" type="button" @click="openNaverMap(form.place.name.trim())">
          네이버 지도에서 주소 찾기
        </button>
        <PlaceMap v-if="mapPlace.address.trim()" :place="mapPlace" />
      </fieldset>

      <div class="field">
        <label for="camp-date">날짜</label>
        <input id="camp-date" v-model="form.date" class="input" type="date" />
        <span v-if="submitted && dateError" class="field-error">{{ dateError }}</span>
      </div>

      <div class="page-actions">
        <button class="btn btn-primary" type="submit">다음: 멤버 추가</button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import type { CampPlace } from '~/types/camp'

const store = useCampStore()
const route = useRoute()

const camp = computed(() => store.currentCamp)
const form = reactive({
  name: camp.value?.name ?? '',
  place: { name: camp.value?.place?.name ?? '', address: camp.value?.place?.address ?? '' },
  date: camp.value?.date ?? '',
})
/** 지도는 주소 입력을 마쳤을 때만 다시 그린다. */
const mapPlace = ref<CampPlace>({ ...form.place })
const submitted = ref(false)

const nameError = computed(() => (form.name.trim() ? '' : '캠핑명을 입력해 주세요.'))
const dateError = computed(() => (form.date ? '' : '날짜를 선택해 주세요.'))

function save() {
  submitted.value = true
  if (nameError.value || dateError.value) return
  store.updateCampInfo({ name: form.name, place: form.place, date: form.date })
  navigateTo(`/camps/${route.params.campId}/members`)
}
</script>

<style scoped lang="scss">
.place {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0 0 var(--space-4);
  padding: 0;
  border: 0;

  legend {
    margin-bottom: var(--space-1);
    padding: 0;
    font-size: 14px;
    font-weight: 600;
  }
}

.find {
  align-self: flex-start;
  color: #03c75a;
}
</style>
