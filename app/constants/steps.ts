export interface CampStep {
  path: 'info' | 'members' | 'distribute' | 'schedule' | 'meals' | 'result'
  label: string
}

export const CAMP_STEPS: CampStep[] = [
  { path: 'info', label: '캠핑 정보' },
  { path: 'members', label: '멤버' },
  { path: 'distribute', label: '장비' },
  { path: 'schedule', label: '일정' },
  { path: 'meals', label: '음식' },
  { path: 'result', label: '결과' },
]
