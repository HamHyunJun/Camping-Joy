import { defineStore } from 'pinia'
import type { Camp, Equipment, ID, Member, Person } from '~/types/camp'
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

    // 멤버 (장비 등록에 있는 사람을 캠핑에 넣는다)
    addMember(person: Person): Member | null {
      const camp = this.currentCamp
      if (!camp || camp.members.some((m) => m.id === person.id)) return null
      const member: Member = { id: person.id, name: person.name, equipments: [] }
      camp.members.push(member)
      camp.updatedAt = now()
      return member
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
    /** 장비 등록에서 이름을 바꾸면 모든 캠핑의 멤버 이름도 맞춘다. */
    syncMemberName(personId: ID, name: string) {
      for (const camp of this.camps) {
        const member = camp.members.find((m) => m.id === personId)
        if (member) member.name = name
      }
    },

    // 배분: 멤버별 담당 장비 (Member.equipments). 다른 멤버의 장비를 맡을 수도 있고, ownerId로 원래 주인을 안다.
    /** 이 장비가 이번 캠핑에서 이미 몇 개 배분됐는지 (모든 멤버 합계) */
    assignedQuantity(equipmentId: ID): number {
      return (this.currentCamp?.members ?? []).reduce(
        (sum, m) => sum + (m.equipments.find((e) => e.id === equipmentId)?.quantity ?? 0),
        0,
      )
    },
    /** 보유 장비 하나를 멤버의 담당 장비에 1개 더한다. 모든 멤버 합계가 보유 수량을 넘지 않는다. */
    addMemberEquipment(memberId: ID, owned: Equipment) {
      const camp = this.currentCamp
      const member = camp?.members.find((m) => m.id === memberId)
      if (!camp || !member) return
      if (this.assignedQuantity(owned.id) >= owned.quantity) return
      const bringing = member.equipments.find((e) => e.id === owned.id)
      if (bringing) bringing.quantity += 1
      else member.equipments.push({ ...owned, quantity: 1 })
      camp.updatedAt = now()
    },
    /** 담당 장비에서 1개 뺀다. 0개가 되면 목록에서 지운다. */
    removeMemberEquipment(memberId: ID, equipmentId: ID) {
      const camp = this.currentCamp
      const member = camp?.members.find((m) => m.id === memberId)
      const bringing = member?.equipments.find((e) => e.id === equipmentId)
      if (!camp || !member || !bringing) return
      bringing.quantity -= 1
      if (bringing.quantity < 1) member.equipments = member.equipments.filter((e) => e.id !== equipmentId)
      camp.updatedAt = now()
    },

    // 배분은 4단계 이후에 추가한다.
  },
  persist: true,
})
