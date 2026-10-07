export type ID = string

export type EquipmentCategory =
  | 'shelter'
  | 'furniture'
  | 'kitchen'
  | 'sleeping'
  | 'lighting'
  | 'etc'

/**
 * 장비.
 * - 장비 등록(Person.equipments)에서는 보유 수량
 * - 캠핑 멤버(Member.equipments)에서는 이번 캠핑에 가져갈 수량이며, id는 등록된 장비 id와 같다
 */
export interface Equipment {
  id: ID
  name: string
  category: EquipmentCategory
  quantity: number
  /** 크기 (텐트 '2~3인용', 테이블·아이스박스 '소'/'중'/'대' 등). 크기 구분이 있는 장비만 */
  size?: string
  /** 장비를 가진 사람(Person.id) */
  ownerId: ID
}

/** 장비 등록 화면에서 관리하는 사람. 캠핑마다 다시 입력하지 않도록 캠핑과 별도로 저장한다. */
export interface Person {
  id: ID
  name: string
  equipments: Equipment[]
}

/** 캠핑에 참여하는 멤버. id는 Person.id와 같다. */
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
  /** 준비 완료로 체크한 담당 장비. `${memberId}:${equipmentId}` 형식 (이전에 저장된 캠핑에는 없을 수 있음) */
  readyItems?: string[]
  /** 캠핑 링크로 공유했을 때 서버 정보 (공유 전에는 없음) */
  remote?: RemoteCamp
  createdAt: string
  updatedAt: string
}

/** 배분 결과 점검에서 나오는 경고 */
export type AssignmentIssue =
  | { type: 'notOwner'; assignmentId: ID }
  | { type: 'overloaded'; memberId: ID; count: number }
  | { type: 'duplicated'; requiredEquipmentId: ID }
  | { type: 'missing'; requiredEquipmentId: ID }

/** 서버에 올린 캠핑. id는 Camp.id와 같다. */
export interface RemoteCamp {
  token: string
  syncedAt: string
}

/** 링크로 연 캠핑을 이 기기에 기억해 두는 항목 (홈 '공유받은 캠핑') */
export interface JoinedCamp {
  token: string
  name: string
  date: string
  /** 이 기기에서 고른 멤버 이름 */
  memberName?: string
  openedAt: string
}

/** 링크로 연 캠핑 화면에 보여줄 서버 데이터 */
export interface SharedCamp {
  id: ID
  name: string
  date: string
  isOwner: boolean
  members: SharedMember[]
}

export interface SharedMember {
  id: ID
  name: string
  /** 다른 기기가 이미 고른 멤버인지 */
  claimed: boolean
  /** 이 기기가 고른 멤버인지 */
  mine: boolean
  items: SharedItem[]
}

export interface SharedItem {
  id: ID
  name: string
  category: EquipmentCategory
  size?: string
  quantity: number
  ready: boolean
}
