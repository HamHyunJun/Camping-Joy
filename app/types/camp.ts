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
  /** 장비 이름(모델명). 텐트만 적는다 (예: '코베아 고스트') */
  model?: string
  /** 장비를 가진 사람(Person.id) */
  ownerId: ID
}

/** 장비 등록 화면에서 관리하는 사람. 캠핑마다 다시 입력하지 않도록 캠핑과 별도로 저장한다. */
export interface Person {
  id: ID
  name: string
  /** 이 사람으로 등록한 계정(auth.users.id). 계정 없이 등록한 예전 멤버에는 없다. */
  userId?: ID
  equipments: Equipment[]
}

/** 캠핑에 참여하는 멤버. id는 Person.id와 같다. */
export interface Member {
  id: ID
  name: string
  equipments: Equipment[]
  /** 장비 등록에 없는 이번 캠핑 한정 게스트. 장비는 배분 화면에서 바로 적는다. */
  guest?: boolean
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

/** 캠핑 일정표 한 줄. 예: 1일차 11:00 집합 */
export interface ScheduleItem {
  id: ID
  /** 몇째 날인지 (1부터). 캠핑 날짜가 1일차 */
  day: number
  /** 'HH:MM' */
  time: string
  title: string
}

/** 끼니 하나와 그때 먹을 메뉴. 예: 1일차 저녁 - 삼겹살 */
export interface Meal {
  id: ID
  /** 몇째 날인지 (1부터) */
  day: number
  /** 아침·점심·저녁·야식·간식 */
  type: string
  menu: string
}

/** 장볼 것. 음식뿐 아니라 물·술 같은 것도 같은 목록에 담는다. */
export interface ShoppingItem {
  id: ID
  name: string
  /** 장을 봤는지 */
  bought: boolean
}

/** 캠핑장. 주소는 네이버 지도로 위치를 보여 줄 때 쓴다. */
export interface CampPlace {
  name: string
  address: string
}

export interface Camp {
  id: ID
  /** 캠핑 이름 (예: 10월 가평 캠핑). 예전 캠핑은 여기에 캠핑장 이름이 들어 있다. */
  name: string
  /** 캠핑장 (이전에 저장된 캠핑에는 없을 수 있음) */
  place?: CampPlace
  /** YYYY-MM-DD */
  date: string
  members: Member[]
  requiredEquipments: RequiredEquipment[]
  assignments: Assignment[]
  /** 준비 완료로 체크한 담당 장비. `${memberId}:${equipmentId}` 형식 (이전에 저장된 캠핑에는 없을 수 있음) */
  readyItems?: string[]
  /** 시간별 일정표 (이전에 저장된 캠핑에는 없을 수 있음) */
  schedule?: ScheduleItem[]
  /** 끼니별 메뉴 (이전에 저장된 캠핑에는 없을 수 있음) */
  menus?: Meal[]
  /** 장볼 것 (이전에 저장된 캠핑에는 없을 수 있음) */
  shopping?: ShoppingItem[]
  /** 서버에 올라간 적이 있는지. 서버에 없는데 true면 다른 사람이 지운 캠핑이다. */
  synced?: boolean
  createdAt: string
  updatedAt: string
}

/** 배분 결과 점검에서 나오는 경고 */
export type AssignmentIssue =
  | { type: 'notOwner'; assignmentId: ID }
  | { type: 'overloaded'; memberId: ID; count: number }
  | { type: 'duplicated'; requiredEquipmentId: ID }
  | { type: 'missing'; requiredEquipmentId: ID }
