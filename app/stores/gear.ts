import { defineStore } from 'pinia'
import type { Equipment, EquipmentCategory, ID, Person } from '~/types/camp'
import idUtil from '~/utils/id'

interface GearState {
  people: Person[]
  /** 이 기기에 있던 등록 목록을 서버에 한 번 올렸는지 (처음 연결할 때만 올린다) */
  syncedOnce: boolean
}

export interface EquipmentInput {
  name: string
  category: EquipmentCategory
  quantity: number
  size?: string
  model?: string
}

/** 사람별 보유 장비 등록. 여러 캠핑에서 불러 쓴다. */
export const useGearStore = defineStore('gear', {
  state: (): GearState => ({
    people: [],
    syncedOnce: false,
  }),
  getters: {
    findPerson: (state) => (personId: ID): Person | undefined =>
      state.people.find((p) => p.id === personId),
    findPersonByName: (state) => (name: string): Person | undefined =>
      state.people.find((p) => p.name === name.trim()),
  },
  actions: {
    addPerson(name: string): Person | undefined {
      const trimmed = name.trim()
      if (!trimmed) return undefined
      const existing = this.findPersonByName(trimmed)
      if (existing) return existing
      const person: Person = { id: idUtil.createId(), name: trimmed, equipments: [] }
      this.people.push(person)
      return person
    },
    renamePerson(personId: ID, name: string): void {
      const person = this.findPerson(personId)
      const trimmed = name.trim()
      if (!person || !trimmed) return
      person.name = trimmed
      useCampStore().syncMemberName(personId, trimmed)
    },
    /** 서버의 등록 목록으로 바꾼다. 다른 기기에서 바뀐 이름·장비를 이 기기의 캠핑에도 맞춘다. */
    replacePeople(next: Person[]): void {
      const camps = useCampStore()
      for (const person of this.people) {
        if (!next.some((p) => p.id === person.id)) camps.removePersonFromCamps(person.id)
      }
      for (const person of next) {
        const previous = this.findPerson(person.id)
        if (!previous) continue
        if (previous.name !== person.name) camps.syncMemberName(person.id, person.name)
        if (JSON.stringify(previous.equipments) !== JSON.stringify(person.equipments)) {
          camps.syncOwnerEquipments(person.id, person.equipments)
        }
      }
      this.people = next
    },
    removePerson(personId: ID): void {
      this.people = this.people.filter((p) => p.id !== personId)
      useCampStore().removePersonFromCamps(personId)
    },

    addEquipment(personId: ID, input: EquipmentInput): Equipment | undefined {
      const person = this.findPerson(personId)
      const name = input.name.trim()
      if (!person || !name || input.quantity < 1) return undefined
      const model = input.model?.trim() || undefined
      // 같은 이름·카테고리·크기·모델명 장비가 이미 있으면 수량만 늘린다.
      const same = person.equipments.find(
        (e) => e.name === name && e.category === input.category && e.size === input.size && e.model === model,
      )
      if (same) {
        same.quantity += input.quantity
        return same
      }
      const equipment: Equipment = {
        id: idUtil.createId(),
        name,
        category: input.category,
        quantity: input.quantity,
        ...(input.size ? { size: input.size } : {}),
        ...(model ? { model } : {}),
        ownerId: personId,
      }
      person.equipments.push(equipment)
      return equipment
    },
    /** 크기를 바꾼다. 같은 크기의 장비가 이미 있으면 하나로 합친다. */
    setEquipmentSize(personId: ID, equipmentId: ID, size: string): void {
      const person = this.findPerson(personId)
      const equipment = person?.equipments.find((e) => e.id === equipmentId)
      if (!person || !equipment) return
      const same = person.equipments.find(
        (e) =>
          e.id !== equipmentId &&
          e.name === equipment.name &&
          e.category === equipment.category &&
          e.size === size &&
          e.model === equipment.model,
      )
      if (same) {
        same.quantity += equipment.quantity
        person.equipments = person.equipments.filter((e) => e.id !== equipmentId)
        useCampStore().syncOwnerEquipments(personId, person.equipments, { [equipmentId]: same.id })
        return
      }
      equipment.size = size
      useCampStore().syncOwnerEquipments(personId, person.equipments)
    },
    /** 이름(모델명)을 바꾼다. 비우면 지운다. */
    setEquipmentModel(personId: ID, equipmentId: ID, model: string): void {
      const person = this.findPerson(personId)
      const equipment = person?.equipments.find((e) => e.id === equipmentId)
      if (!person || !equipment) return
      const trimmed = model.trim().slice(0, 30)
      if (trimmed) equipment.model = trimmed
      else delete equipment.model
      useCampStore().syncOwnerEquipments(personId, person.equipments)
    },
    setEquipmentQuantity(personId: ID, equipmentId: ID, quantity: number): void {
      const person = this.findPerson(personId)
      if (!person) return
      if (quantity < 1) {
        person.equipments = person.equipments.filter((e) => e.id !== equipmentId)
      } else {
        const equipment = person.equipments.find((e) => e.id === equipmentId)
        if (equipment) equipment.quantity = quantity
      }
      useCampStore().syncOwnerEquipments(personId, person.equipments)
    },
  },
  persist: true,
})
