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

export interface EquipmentSizeOption {
  label: string
  /** 툴팁에 보여줄 기준 */
  description?: string
}

export interface EquipmentSizeGuide {
  title: string
  options: EquipmentSizeOption[]
}

/** 크기를 고를 수 있는 장비 (장비 이름 기준) */
export const EQUIPMENT_SIZE_GUIDES: Record<string, EquipmentSizeGuide> = {
  텐트: {
    title: '텐트 크기',
    options: [
      { label: '1~2인용' },
      { label: '2~3인용' },
      { label: '3~4인용' },
      { label: '4~5인용' },
      { label: '5~6인용' },
    ],
  },
  테이블: {
    title: '테이블 크기 기준',
    options: [
      { label: '소', description: '1인용' },
      { label: '중', description: '2~3인용' },
      { label: '대', description: '4인용 이상' },
    ],
  },
  아이스박스: {
    title: '아이스박스 크기 기준',
    options: [
      { label: '소', description: '20L 미만' },
      { label: '중', description: '20~50L' },
      { label: '대', description: '50L 이상' },
    ],
  },
}
