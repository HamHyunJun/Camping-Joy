import type { Assignment, Camp, CampPlace, EquipmentCategory, Member, RequiredEquipment, ScheduleItem } from '~/types/camp'

// supabase/migrations 의 테이블을 supabase-js에 알려 주는 타입 (supabase gen types 형식을 손으로 맞춤)
// supabase-js는 Row가 interface면 타입이 never가 되므로, 여기만 type alias를 쓴다.
type Table<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] }

export type GroupRole = 'owner' | 'admin' | 'member' | 'pending'

/** 모임. 로그인하면 누구나 목록을 본다. */
export type GroupRow = {
  id: string
  name: string
  description: string
  region: string
  created_at: string
}

/** 모임에서 한 계정이 맡은 역할. pending은 가입 신청 중이다. */
export type GroupMemberRow = {
  group_id: string
  user_id: string
  role: GroupRole
  created_at: string
}

export type PersonRow = {
  id: string
  group_id: string
  name: string
  user_id: string | null
  created_at: string
}

/** 멤버 카드를 함께 쓰는 계정. 대표 계정(PersonRow.user_id)과 별개로 관리자가 연결한다. */
export type PersonAccountRow = {
  person_id: string
  user_id: string
  group_id: string
  created_at: string
}

export type EquipmentRow = {
  id: string
  person_id: string
  name: string
  category: EquipmentCategory
  size: string | null
  model: string | null
  quantity: number
  created_at: string
}

/** 로그인한 사람의 프로필. 닉네임이 없으면 아직 프로필을 정하지 않은 것이다. */
export type ProfileRow = {
  id: string
  username: string | null
  nickname: string | null
  greeting: string | null
  avatar: string | null
  created_at: string
}

/** 캠핑 한 개. 멤버·배분 등은 data에 그대로 넣는다. */
export type CampRow = {
  id: string
  group_id: string
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
  /** 예전 캠핑에는 없을 수 있다 */
  schedule?: ScheduleItem[]
  /** 예전 캠핑에는 없을 수 있다 */
  place?: CampPlace
  /** 예전 캠핑에는 없을 수 있다 */
  menus?: Camp['menus']
  /** 예전 캠핑에는 없을 수 있다 */
  shopping?: Camp['shopping']
}

export interface Database {
  public: {
    Tables: {
      people: Table<PersonRow, Omit<PersonRow, 'created_at'>>
      person_accounts: Table<PersonAccountRow, Omit<PersonAccountRow, 'created_at'>>
      equipments: Table<EquipmentRow, Omit<EquipmentRow, 'created_at'>>
      camps: Table<CampRow, CampRow>
      groups: Table<GroupRow, Pick<GroupRow, 'name'>>
      group_members: Table<GroupMemberRow, Omit<GroupMemberRow, 'created_at'>>
      profiles: Table<ProfileRow, Pick<ProfileRow, 'id'> & Partial<Pick<ProfileRow, 'nickname' | 'greeting' | 'avatar'>>>
    }
    Views: Record<never, never>
    Functions: {
      create_group: { Args: { p_name: string; p_description: string; p_region: string }; Returns: string }
      group_member_counts: { Args: Record<never, never>; Returns: { group_id: string; member_count: number }[] }
      request_join: { Args: { g: string }; Returns: undefined }
      cancel_join: { Args: { g: string }; Returns: undefined }
      update_group: { Args: { g: string; p_description: string; p_region: string }; Returns: undefined }
      delete_group: { Args: { g: string }; Returns: undefined }
      decide_join: { Args: { g: string; u: string; approve: boolean }; Returns: undefined }
      remove_group_member: { Args: { g: string; u: string }; Returns: undefined }
      set_member_role: { Args: { g: string; u: string; new_role: 'admin' | 'member' }; Returns: undefined }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}
