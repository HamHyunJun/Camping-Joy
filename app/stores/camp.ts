import { defineStore } from 'pinia'
import type { Camp, ID, Member } from '~/types/camp'
import { createId } from '~/utils/id'

interface CampState {
  camps: Camp[]
  currentCampId: ID | null
}

export interface CampInfoInput {
  name: string
  date: string
}

function now(): string {
  return new Date().toISOString()
}

function today(): string {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export const useCampStore = defineStore('camp', {
  state: (): CampState => ({
    camps: [],
    currentCampId: null,
  }),
  getters: {
    currentCamp: (state): Camp | null =>
      state.camps.find((camp) => camp.id === state.currentCampId) ?? null,
    sortedCamps: (state): Camp[] =>
      [...state.camps].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  },
  actions: {
    // 캠핑
    createCamp(): ID {
      const timestamp = now()
      const camp: Camp = {
        id: createId(),
        name: '',
        date: today(),
        members: [],
        requiredEquipments: [],
        assignments: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      this.camps.push(camp)
      this.currentCampId = camp.id
      return camp.id
    },
    selectCamp(campId: ID): boolean {
      const exists = this.camps.some((camp) => camp.id === campId)
      this.currentCampId = exists ? campId : null
      return exists
    },
    updateCampInfo(input: CampInfoInput) {
      const camp = this.currentCamp
      if (!camp) return
      camp.name = input.name.trim()
      camp.date = input.date
      camp.updatedAt = now()
    },
    deleteCamp(campId: ID) {
      this.camps = this.camps.filter((camp) => camp.id !== campId)
      if (this.currentCampId === campId) this.currentCampId = null
    },

    // 멤버
    addMember(name: string): Member | null {
      const camp = this.currentCamp
      const trimmed = name.trim()
      if (!camp || !trimmed) return null
      const member: Member = { id: createId(), name: trimmed, equipments: [] }
      camp.members.push(member)
      camp.updatedAt = now()
      return member
    },
    renameMember(memberId: ID, name: string) {
      const camp = this.currentCamp
      const member = camp?.members.find((m) => m.id === memberId)
      const trimmed = name.trim()
      if (!camp || !member || !trimmed) return
      member.name = trimmed
      camp.updatedAt = now()
    },
    removeMember(memberId: ID) {
      const camp = this.currentCamp
      if (!camp) return
      camp.members = camp.members.filter((m) => m.id !== memberId)
      // 멤버가 맡고 있던 배분은 담당자 없음으로 되돌린다.
      for (const assignment of camp.assignments) {
        if (assignment.memberId !== memberId) continue
        assignment.memberId = null
        assignment.equipmentId = null
        assignment.status = 'unassigned'
      }
      camp.updatedAt = now()
    },

    // 장비는 3단계, 배분은 4단계 이후에 추가한다.
  },
  persist: true,
})
