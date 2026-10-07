import type { Camp } from '~/types/camp'
import { CAMP_STEPS, type CampStep } from '~/constants/steps'

/** 단계 입력이 끝났는지 */
export function isStepComplete(camp: Camp, path: CampStep['path']): boolean {
  switch (path) {
    case 'info':
      return Boolean(camp.name.trim() && camp.date)
    case 'members':
      return camp.members.length > 0
    case 'distribute':
      return camp.members.some((m) => m.equipments.length > 0)
    case 'result':
      return true
  }
}

/** 앞 단계가 모두 입력됐을 때만 들어갈 수 있다. */
export function canVisitStep(camp: Camp, path: CampStep['path']): boolean {
  const index = CAMP_STEPS.findIndex((step) => step.path === path)
  return CAMP_STEPS.slice(0, index).every((step) => isStepComplete(camp, step.path))
}

/** 들어갈 수 있는 마지막 단계 (주소로 바로 들어온 경우 되돌려 보낼 곳) */
export function lastVisitableStep(camp: Camp): CampStep['path'] {
  const visitable = CAMP_STEPS.filter((step) => canVisitStep(camp, step.path))
  return visitable[visitable.length - 1]?.path ?? 'info'
}

export interface CampProgress {
  /** 이어서 할 단계 */
  step: CampStep['path']
  label: string
  /** 챙길 장비 항목 수와 준비 완료 항목 수 (결과 화면과 같은 기준) */
  total: number
  ready: number
}

/** 캠핑 목록에 보여줄 진행 상태 */
export function campProgress(camp: Camp): CampProgress {
  const step = lastVisitableStep(camp)
  let total = 0
  let ready = 0
  for (const member of camp.members) {
    for (const item of member.equipments) {
      total += 1
      if (camp.readyItems?.includes(`${member.id}:${item.id}`)) ready += 1
    }
  }
  const labels: Record<CampStep['path'], string> = {
    info: '캠핑 정보 입력 중',
    members: '멤버 고르는 중',
    distribute: '장비 배분 중',
    result: ready === total ? '준비 완료' : '준비 중',
  }
  return { step, label: labels[step], total, ready }
}
