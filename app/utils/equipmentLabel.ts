import type { Equipment } from '~/types/camp'
import { EQUIPMENT_SIZE_GUIDES, type EquipmentSizeGuide } from '~/constants/equipment'

export default {
  /** 크기를 고를 수 있는 장비면 크기 기준을 돌려준다. */
  sizeGuideOf(name: string): EquipmentSizeGuide | undefined {
    return EQUIPMENT_SIZE_GUIDES[name.trim()]
  },

  /** 이름(모델명)을 적을 수 있는 장비인지. 지금은 텐트만. */
  hasModelName(name: string): boolean {
    return name.trim() === '텐트'
  },

  /** 화면에 보여줄 장비 이름. '텐트 · 코베아 고스트 (2~3인용)'처럼 이름과 크기를 붙인다. */
  equipmentLabel(equipment: Pick<Equipment, 'name' | 'size' | 'model'>): string {
    const name = equipment.model ? `${equipment.name} · ${equipment.model}` : equipment.name
    return equipment.size ? `${name} (${equipment.size})` : name
  },
}
