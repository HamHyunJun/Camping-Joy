import { defineStore } from 'pinia'
import type { Camp, ID } from '~/types/camp'

interface CampState {
  camps: Camp[]
  currentCampId: ID | null
}

export const useCampStore = defineStore('camp', {
  state: (): CampState => ({
    camps: [],
    currentCampId: null,
  }),
  getters: {
    currentCamp: (state): Camp | null =>
      state.camps.find((camp) => camp.id === state.currentCampId) ?? null,
  },
  actions: {
    // 캠핑·멤버 액션은 2단계, 장비는 3단계, 배분은 4단계 이후에 추가한다.
  },
  persist: true,
})
