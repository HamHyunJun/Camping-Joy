export interface CampStep {
  path: 'info' | 'members' | 'equipments' | 'distribute' | 'result'
  label: string
}

export const CAMP_STEPS: CampStep[] = [
  { path: 'info', label: '캠핑 정보' },
  { path: 'members', label: '멤버' },
  { path: 'equipments', label: '장비' },
  { path: 'distribute', label: '배분' },
  { path: 'result', label: '결과' },
]
