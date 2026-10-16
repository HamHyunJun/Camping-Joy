import type { Equipment, EquipmentCategory } from '~/types/camp'
import { EQUIPMENT_CATEGORY_LABELS } from '~/constants/equipment'

export interface EquipmentGroup {
  category: EquipmentCategory
  label: string
  items: Equipment[]
}

export default {
  /** 카테고리 정의 순서대로 묶고, 빈 카테고리는 뺀다. */
  groupByCategory(equipments: Equipment[]): EquipmentGroup[] {
    const categories = Object.keys(EQUIPMENT_CATEGORY_LABELS) as EquipmentCategory[]
    return categories
      .map((category) => ({
        category,
        label: EQUIPMENT_CATEGORY_LABELS[category],
        items: equipments.filter((e) => e.category === category),
      }))
      .filter((group) => group.items.length > 0)
  },
}
