import type { EquipmentCategory } from '~/types/camp'

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  shelter: '텐트/타프',
  furniture: '테이블/의자',
  kitchen: '주방',
  sleeping: '침구',
  lighting: '조명',
  etc: '기타',
}

export interface EquipmentPreset {
  name: string
  category: EquipmentCategory
}

export const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  { name: '텐트', category: 'shelter' },
  { name: '타프', category: 'shelter' },
  { name: '테이블', category: 'furniture' },
  { name: '의자', category: 'furniture' },
  { name: '버너', category: 'kitchen' },
  { name: '코펠', category: 'kitchen' },
  { name: '아이스박스', category: 'kitchen' },
  { name: '침낭', category: 'sleeping' },
  { name: '매트', category: 'sleeping' },
  { name: '랜턴', category: 'lighting' },
]
