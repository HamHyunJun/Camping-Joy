export default {
  /** 'YYYY-MM-DD' → '2026년 10월 11일 (토)' */
  formatDate(date: string): string {
    const parsed = new Date(`${date}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  },

  /** 오늘 기준 D-day 문구. 'D-3', 'D-DAY', '지난 캠핑' */
  formatDday(date: string): string {
    const target = new Date(`${date}T00:00:00`)
    if (Number.isNaN(target.getTime())) return ''
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = Math.round((target.getTime() - today.getTime()) / 86_400_000)
    if (days === 0) return 'D-DAY'
    return days > 0 ? `D-${days}` : '지난 캠핑'
  },

  /** 캠핑 날짜에서 n일차 날짜. 'YYYY-MM-DD', 1일차 → '10월 11일 (토)' */
  formatDayDate(date: string, day: number): string {
    const parsed = new Date(`${date}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return ''
    parsed.setDate(parsed.getDate() + day - 1)
    return parsed.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
  },

  /** 일정 정렬: 날 → 시간 순 */
  sortSchedule<T extends { day: number; time: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time))
  },

  /** 정렬된 일정을 날짜별로 묶는다. */
  scheduleGroups<T extends { day: number }>(items: T[]): { day: number; items: T[] }[] {
    const groups: { day: number; items: T[] }[] = []
    for (const item of items) {
      const last = groups[groups.length - 1]
      if (last?.day === item.day) last.items.push(item)
      else groups.push({ day: item.day, items: [item] })
    }
    return groups
  },
}
