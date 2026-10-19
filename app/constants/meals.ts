/** 끼니 종류. 하루 안에서 이 순서로 보여 준다. */
export const MEAL_TYPES = ['아침', '점심', '저녁', '야식', '간식']

/** 새 캠핑에서 처음 채워 두는 끼니 (1박 2일 기준) */
export const DEFAULT_MEALS: { day: number; type: string }[] = [
  { day: 1, type: '점심' },
  { day: 1, type: '저녁' },
  { day: 1, type: '야식' },
  { day: 2, type: '아침' },
  { day: 2, type: '점심' },
]
