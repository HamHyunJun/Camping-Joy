export type ID = string

export type EquipmentCategory =
  | 'shelter'
  | 'furniture'
  | 'kitchen'
  | 'sleeping'
  | 'lighting'
  | 'etc'

/** 멤버가 보유한 장비 */
export interface Equipment {
  id: ID
  name: string
  category: EquipmentCategory
  quantity: number
  ownerId: ID
}

export interface Member {
  id: ID
  name: string
  equipments: Equipment[]
}

/** 이번 캠핑에 필요한 장비 */
export interface RequiredEquipment {
  id: ID
  name: string
  category: EquipmentCategory
  quantity: number
}

export type AssignmentStatus =
  | 'unassigned' // 아직 담당자 없음
  | 'assigned' // 담당자 정해짐
  | 'ready' // 준비 완료
  | 'missing' // 보유자가 없어 준비 불가

/** 필요 장비 하나를 어떤 멤버의 어떤 장비로 준비할지 */
export interface Assignment {
  id: ID
  requiredEquipmentId: ID
  memberId: ID | null
  equipmentId: ID | null
  quantity: number
  status: AssignmentStatus
}

export interface Camp {
  id: ID
  /** 캠핑장 이름 */
  name: string
  /** YYYY-MM-DD */
  date: string
  members: Member[]
  requiredEquipments: RequiredEquipment[]
  assignments: Assignment[]
  createdAt: string
  updatedAt: string
}

/** 배분 결과 점검에서 나오는 경고 */
export type AssignmentIssue =
  | { type: 'notOwner'; assignmentId: ID }
  | { type: 'overloaded'; memberId: ID; count: number }
  | { type: 'duplicated'; requiredEquipmentId: ID }
  | { type: 'missing'; requiredEquipmentId: ID }
