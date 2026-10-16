import type { Assignment, AssignmentIssue, Member, RequiredEquipment } from '~/types/camp'

export interface ValidateInput {
  members: Member[]
  requiredEquipments: RequiredEquipment[]
  assignments: Assignment[]
}

/** 배분 결과 점검 (보유 여부 / 과부하 / 중복 / 누락). 6단계에서 구현한다. */
export interface ValidateAssignments {
  (input: ValidateInput): AssignmentIssue[]
}
