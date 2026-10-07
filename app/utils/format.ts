/** 'YYYY-MM-DD' → '2026년 10월 11일 (토)' */
export function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

/** 오늘 기준 D-day 문구. 'D-3', 'D-DAY', '지난 캠핑' */
export function formatDday(date: string): string {
  const target = new Date(`${date}T00:00:00`)
  if (Number.isNaN(target.getTime())) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000)
  if (days === 0) return 'D-DAY'
  return days > 0 ? `D-${days}` : '지난 캠핑'
}
