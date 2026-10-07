import { defineStore } from 'pinia'
import type { Camp, Equipment, ID, Member, Person } from '~/types/camp'
import { createId } from '~/utils/id'

interface CampState {
  camps: Camp[]
  currentCampId: ID | null
  /** 이 기기를 쓰는 사람(등록된 Person.id). '내가 참여한 캠핑'을 고를 때 쓴다. */
  meId: ID | null
  /** 이 기기에 있던 캠핑을 서버에 한 번 올렸는지 (처음 연결할 때만 올린다) */
  syncedOnce: boolean
}

export interface CampInfoInput {
  name: string
  date: string
}

function now(): string {
  return new Date().toISOString()
}

function readyKey(memberId: ID, equipmentId: ID): string {
  return `${memberId}:${equipmentId}`
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
    meId: null,
    syncedOnce: false,
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
        readyItems: [],
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
    /** '새 캠핑'만 누르고 정보를 저장하지 않은 빈 캠핑을 지운다. */
    removeEmptyDrafts() {
      const empty = this.camps.filter((camp) => !camp.name.trim() && !camp.members.length)
      for (const camp of empty) this.deleteCamp(camp.id)
    },
    /** 서버의 캠핑 목록으로 바꾼다. 아직 서버에 올리지 않은 이 기기의 캠핑은 남긴다. */
    replaceCamps(server: Camp[]) {
      const pending = this.camps.filter((camp) => !camp.synced && !server.some((c) => c.id === camp.id))
      this.camps = [...server, ...pending]
      if (this.currentCampId && !this.camps.some((c) => c.id === this.currentCampId)) this.currentCampId = null
    },
    markSynced(campIds: ID[]) {
      for (const camp of this.camps) if (campIds.includes(camp.id)) camp.synced = true
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

    // 멤버·장비 등록이 바뀌었을 때 모든 캠핑 데이터를 맞춘다.
    /** 이 사람이 멤버로 들어 있는 캠핑 수 */
    countCampsWithPerson(personId: ID): number {
      return this.camps.filter((camp) => camp.members.some((m) => m.id === personId)).length
    },
    /** 같은 사람이 다른 id로 등록돼 있을 때(서버 목록과 처음 합칠 때) 캠핑 멤버 id를 바꾼다. */
    remapPerson(oldId: ID, newId: ID) {
      for (const camp of this.camps) {
        if (camp.members.some((m) => m.id === newId)) continue
        const member = camp.members.find((m) => m.id === oldId)
        if (!member) continue
        member.id = newId
        for (const item of member.equipments) if (item.ownerId === oldId) item.ownerId = newId
        camp.readyItems = camp.readyItems?.map((key) => (key.startsWith(`${oldId}:`) ? `${newId}${key.slice(oldId.length)}` : key))
      }
    },
    /** 등록에서 사람을 지우면 모든 캠핑에서 멤버와 그 사람의 장비를 뺀다. */
    removePersonFromCamps(personId: ID) {
      for (const camp of this.camps) {
        camp.members = camp.members.filter((m) => m.id !== personId)
        for (const member of camp.members) {
          member.equipments = member.equipments.filter((e) => e.ownerId !== personId)
        }
        camp.readyItems = camp.readyItems?.filter((key) => !key.startsWith(`${personId}:`))
      }
    },
    /**
     * 등록에서 한 사람의 장비가 바뀌면(삭제, 수량, 크기) 모든 캠핑의 챙길 장비를 맞춘다.
     * - 없어진 장비는 빼고, 크기를 합쳐 id가 바뀐 장비는 새 id로 옮긴다.
     * - 챙길 수량이 보유 수량을 넘으면 보유 수량으로 줄인다.
     */
    syncOwnerEquipments(personId: ID, owned: Equipment[], renamedIds: Record<ID, ID> = {}) {
      for (const camp of this.camps) {
        for (const member of camp.members) {
          const next: Equipment[] = []
          for (const item of member.equipments) {
            if (item.ownerId !== personId) {
              next.push(item)
              continue
            }
            const id = renamedIds[item.id] ?? item.id
            const source = owned.find((e) => e.id === id)
            if (!source) continue
            const existing = next.find((e) => e.id === id)
            if (existing) existing.quantity += item.quantity
            else next.push({ ...source, quantity: item.quantity })
          }
          for (const item of next) {
            const source = owned.find((e) => e.id === item.id && e.ownerId === personId)
            if (source) item.quantity = Math.min(item.quantity, source.quantity)
          }
          const keptIds = new Set(next.map((e) => e.id))
          camp.readyItems = camp.readyItems?.filter(
            (key) => !key.startsWith(`${member.id}:`) || keptIds.has(key.slice(member.id.length + 1)),
          )
          member.equipments = next
        }
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
      if (bringing.quantity < 1) {
        member.equipments = member.equipments.filter((e) => e.id !== equipmentId)
        camp.readyItems = camp.readyItems?.filter((k) => k !== readyKey(memberId, equipmentId))
      }
      camp.updatedAt = now()
    },

    // 초기화
    /** 멤버를 모두 뺀다. 배분과 준비 체크도 함께 비운다. */
    resetMembers() {
      const camp = this.currentCamp
      if (!camp) return
      camp.members = []
      camp.assignments = []
      camp.readyItems = []
      camp.updatedAt = now()
    },
    /** 멤버는 두고 배분(챙길 장비)과 준비 체크만 비운다. */
    resetDistribution() {
      const camp = this.currentCamp
      if (!camp) return
      for (const member of camp.members) member.equipments = []
      camp.readyItems = []
      camp.updatedAt = now()
    },

    // 결과: 담당 장비 준비 완료 체크
    isReady(memberId: ID, equipmentId: ID): boolean {
      return this.currentCamp?.readyItems?.includes(readyKey(memberId, equipmentId)) ?? false
    },
    toggleReady(memberId: ID, equipmentId: ID) {
      const camp = this.currentCamp
      if (!camp) return
      const key = readyKey(memberId, equipmentId)
      const items = camp.readyItems ?? []
      camp.readyItems = items.includes(key) ? items.filter((k) => k !== key) : [...items, key]
      camp.updatedAt = now()
    },
  },
  persist: true,
})
