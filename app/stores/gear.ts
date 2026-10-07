import { defineStore } from 'pinia'
import type { Equipment, EquipmentCategory, ID, Person } from '~/types/camp'
import { createId } from '~/utils/id'

interface GearState {
  people: Person[]
}

export interface EquipmentInput {
  name: string
  category: EquipmentCategory
  quantity: number
}

/** 사람별 보유 장비 등록. 여러 캠핑에서 불러 쓴다. */
export const useGearStore = defineStore('gear', {
  state: (): GearState => ({
    people: [],
  }),
  getters: {
    findPerson: (state) => (personId: ID): Person | undefined =>
      state.people.find((p) => p.id === personId),
    findPersonByName: (state) => (name: string): Person | undefined =>
      state.people.find((p) => p.name === name.trim()),
  },
  actions: {
    addPerson(name: string): Person | null {
      const trimmed = name.trim()
      if (!trimmed) return null
      const existing = this.findPersonByName(trimmed)
      if (existing) return existing
      const person: Person = { id: createId(), name: trimmed, equipments: [] }
      this.people.push(person)
      return person
    },
    renamePerson(personId: ID, name: string) {
      const person = this.findPerson(personId)
      const trimmed = name.trim()
      if (!person || !trimmed) return
      person.name = trimmed
      useCampStore().syncMemberName(personId, trimmed)
    },
    removePerson(personId: ID) {
      this.people = this.people.filter((p) => p.id !== personId)
    },

    addEquipment(personId: ID, input: EquipmentInput): Equipment | null {
      const person = this.findPerson(personId)
      const name = input.name.trim()
      if (!person || !name || input.quantity < 1) return null
      // 같은 이름·카테고리 장비가 이미 있으면 수량만 늘린다.
      const same = person.equipments.find((e) => e.name === name && e.category === input.category)
      if (same) {
        same.quantity += input.quantity
        return same
      }
      const equipment: Equipment = {
        id: createId(),
        name,
        category: input.category,
        quantity: input.quantity,
        ownerId: personId,
      }
      person.equipments.push(equipment)
      return equipment
    },
    setEquipmentQuantity(personId: ID, equipmentId: ID, quantity: number) {
      const person = this.findPerson(personId)
      if (!person) return
      if (quantity < 1) {
        person.equipments = person.equipments.filter((e) => e.id !== equipmentId)
        return
      }
      const equipment = person.equipments.find((e) => e.id === equipmentId)
      if (equipment) equipment.quantity = quantity
    },
  },
  persist: true,
})
