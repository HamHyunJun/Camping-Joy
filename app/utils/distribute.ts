import type { Assignment, Member, RequiredEquipment } from '~/types/camp'

export interface DistributeInput {
  members: Member[]
  requiredEquipments: RequiredEquipment[]
}

/** 배분 전략. 알고리즘을 바꿀 때는 이 타입을 따르는 함수만 새로 만든다. */
export type DistributeStrategy = (input: DistributeInput) => Assignment[]

// 실제 배분 로직은 6단계에서 구현한다.
