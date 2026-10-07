import type { Assignment, EquipmentCategory, Member, RequiredEquipment } from '~/types/camp'

// supabase/migrations 의 테이블을 supabase-js에 알려 주는 타입 (supabase gen types 형식을 손으로 맞춤)
type Table<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] }

export type PersonRow = {
  id: string
  name: string
  created_at: string
}

export type EquipmentRow = {
  id: string
  person_id: string
  name: string
  category: EquipmentCategory
  size: string | null
  quantity: number
  created_at: string
}

/** 캠핑 한 개. 멤버·배분 등은 data에 그대로 넣는다. */
export type CampRow = {
  id: string
  name: string
  date: string
  data: CampData
  created_at: string
  updated_at: string
}

export type CampData = {
  members: Member[]
  requiredEquipments: RequiredEquipment[]
  assignments: Assignment[]
  readyItems: string[]
}

export interface Database {
  public: {
    Tables: {
      people: Table<PersonRow, Omit<PersonRow, 'created_at'>>
      equipments: Table<EquipmentRow, Omit<EquipmentRow, 'created_at'>>
      camps: Table<CampRow, CampRow>
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
