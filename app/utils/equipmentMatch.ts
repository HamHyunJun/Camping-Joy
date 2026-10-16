import type { Equipment, RequiredEquipment } from '~/types/camp'

const normalizeName = (name: string): string => name.replace(/\s+/g, '').toLowerCase()

export default {
  /** 보유 장비가 필요 장비와 같은 장비인지 판단한다. 같은 장비 기준은 이 함수 한 곳에서만 관리한다. */
  isSameEquipment(owned: Equipment, required: RequiredEquipment): boolean {
    return owned.category === required.category && normalizeName(owned.name) === normalizeName(required.name)
  },
}
