import type { Equipment } from '~/types/camp'
import { EQUIPMENT_SIZE_GUIDES, type EquipmentSizeGuide } from '~/constants/equipment'

/** 크기를 고를 수 있는 장비면 크기 기준을 돌려준다. */
export function sizeGuideOf(name: string): EquipmentSizeGuide | undefined {
  return EQUIPMENT_SIZE_GUIDES[name.trim()]
}

/** 화면에 보여줄 장비 이름. 크기가 있으면 '텐트 (2~3인용)'처럼 붙인다. */
export function equipmentLabel(equipment: Pick<Equipment, 'name' | 'size'>): string {
  return equipment.size ? `${equipment.name} (${equipment.size})` : equipment.name
}
