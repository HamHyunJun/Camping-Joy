import { defineStore } from 'pinia'
import type { Equipment, EquipmentCategory, ID, Person } from '~/types/camp'
import idUtil from '~/utils/id'

interface GearState {
  people: Person[]
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
  }),
  getters: {
    findPerson: (state) => (personId: ID): Person | undefined =>
      state.people.find((p) => p.id === personId),
    findPersonByName: (state) => (name: string): Person | undefined =>
      state.people.find((p) => p.name === name.trim()),
    /** 로그인한 계정의 본인 카드. 직접 등록했거나 다른 계정과 함께 쓰는 카드 */
    myPerson: (state): Person | undefined => {
      const userId = useAuthStore().user?.id
      return userId ? state.people.find((p) => p.userId === userId || p.sharedUserIds?.includes(userId)) : undefined
    },
    /** 멤버를 새로 등록할 수 있는지. 관리자·운영진은 계속 등록하고, 일반 멤버는 본인 한 명만 등록한다. 서버 설정이 없으면(기기에만 저장) 제한이 없다. */
    canAddPerson(): boolean {
      return !useAuthStore().enabled || useGroupStore().isStaff || !this.myPerson
    },
    /** 관리자·운영진은 누구든, 일반 멤버는 본인 등록만 고칠 수 있다. */
    canEdit() {
      return (personId: ID): boolean => !useAuthStore().enabled || useGroupStore().isStaff || this.myPerson?.id === personId
    },
    /** 멤버 삭제는 관리자·운영진만 할 수 있다. */
    canRemovePerson: (): boolean => !useAuthStore().enabled || useGroupStore().isStaff,
  },
  actions: {
    /** forMe가 true면 내 계정과 연결한 본인으로 등록한다. 일반 멤버는 본인만 등록할 수 있다. */
    addPerson(name: string, forMe = true): Person | undefined {
      const trimmed = name.trim()
      if (!trimmed || !this.canAddPerson) return undefined
      if (useAuthStore().enabled && (forMe ? this.myPerson : !useGroupStore().isStaff)) return undefined
      const existing = this.findPersonByName(trimmed)
      if (existing) return existing
      const userId = forMe ? useAuthStore().user?.id : undefined
      const person: Person = { id: idUtil.createId(), name: trimmed, ...(userId ? { userId } : {}), equipments: [] }
      this.people.push(person)
      return person
    },
    renamePerson(personId: ID, name: string): void {
      const person = this.findPerson(personId)
      const trimmed = name.trim()
      if (!person || !trimmed || !this.canEdit(personId)) return
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
      if (!this.canRemovePerson) return
      this.people = this.people.filter((p) => p.id !== personId)
      useCampStore().removePersonFromCamps(personId)
    },

    addEquipment(personId: ID, input: EquipmentInput): Equipment | undefined {
      const person = this.findPerson(personId)
      const name = input.name.trim()
      if (!person || !name || input.quantity < 1 || !this.canEdit(personId)) return undefined
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
      if (!person || !equipment || !this.canEdit(personId)) return
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
      if (!person || !equipment || !this.canEdit(personId)) return
      const trimmed = model.trim().slice(0, 30)
      if (trimmed) equipment.model = trimmed
      else delete equipment.model
      useCampStore().syncOwnerEquipments(personId, person.equipments)
    },
    setEquipmentQuantity(personId: ID, equipmentId: ID, quantity: number): void {
      const person = this.findPerson(personId)
      if (!person || !this.canEdit(personId)) return
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
