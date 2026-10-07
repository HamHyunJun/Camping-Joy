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
