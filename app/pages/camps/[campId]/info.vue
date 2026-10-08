<template>
  <section>
    <h1 class="page-title">캠핑 정보</h1>
    <p class="page-desc">어디로, 언제 떠나는지 알려주세요.</p>

    <form class="card" novalidate @submit.prevent="save">
      <div class="field">
        <label for="camp-name">캠핑장</label>
        <input
          id="camp-name"
          v-model="form.name"
          class="input"
          type="text"
          placeholder="예: 가평 자라섬 캠핑장"
          maxlength="50"
          autocomplete="off"
        />
        <span v-if="submitted && nameError" class="field-error">{{ nameError }}</span>
      </div>

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
const store = useCampStore()
const route = useRoute()

const camp = computed(() => store.currentCamp)
const form = reactive({
  name: camp.value?.name ?? '',
  date: camp.value?.date ?? '',
})
const submitted = ref(false)

const nameError = computed(() => (form.name.trim() ? '' : '캠핑장 이름을 입력해 주세요.'))
const dateError = computed(() => (form.date ? '' : '날짜를 선택해 주세요.'))

function save() {
  submitted.value = true
  if (nameError.value || dateError.value) return
  store.updateCampInfo({ name: form.name, date: form.date })
  navigateTo(`/camps/${route.params.campId}/members`)
}
</script>
