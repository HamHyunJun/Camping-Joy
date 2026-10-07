import type { EquipmentCategory } from '~/types/camp'

// supabase/migrations 의 테이블을 supabase-js에 알려 주는 타입 (supabase gen types 형식을 손으로 맞춤)
type Table<Row, Insert, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] }

export interface Database {
  public: {
    Tables: {
      camps: Table<
        { id: string; share_token: string; owner_id: string; name: string; date: string; created_at: string; updated_at: string },
        { id?: string; name: string; date: string }
      >
      camp_access: Table<{ camp_id: string; user_id: string; joined_at: string }, { camp_id: string; user_id: string }>
      camp_members: Table<
        { id: string; camp_id: string; name: string; position: number; device_id: string | null },
        { id?: string; camp_id: string; name: string; position?: number }
      >
      camp_gear: Table<
        { id: string; camp_id: string; member_id: string; name: string; category: EquipmentCategory; size: string | null; quantity: number },
        { id?: string; camp_id: string; member_id: string; name: string; category: EquipmentCategory; size?: string | null; quantity: number }
      >
      camp_items: Table<
        { id: string; camp_id: string; gear_id: string; quantity: number; ready: boolean },
        { id?: string; camp_id: string; gear_id: string; quantity: number; ready?: boolean }
      >
    }
    Views: Record<never, never>
    Functions: {
      join_camp: { Args: { token: string }; Returns: string | null }
      claim_member: { Args: { target_camp: string; member: string | null }; Returns: undefined }
      set_item_ready: { Args: { item: string; value: boolean }; Returns: undefined }
      rotate_share_token: { Args: { target_camp: string }; Returns: string }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
