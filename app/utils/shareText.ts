import type { Camp, Equipment } from '~/types/camp'
import { EQUIPMENT_CATEGORY_LABELS } from '~/constants/equipment'

const categoryOrder = Object.keys(EQUIPMENT_CATEGORY_LABELS)

/** 공유용으로 카테고리 순서대로 정렬한 장비 목록 */
export function sortByCategory(list: Equipment[]): Equipment[] {
  return [...list].sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))
}

/** 메신저에 붙여 넣기 좋은 짧은 결과 문구. 멤버별로 챙길 장비를 한 줄씩 적는다. */
export function buildShareText(camp: Camp): string {
  const lines: string[] = []
  const dday = formatDday(camp.date)
  lines.push(`⛺ ${camp.name || '이름 없는 캠핑'}`)
  if (camp.place) {
    const { name, address } = camp.place
    lines.push(`📍 ${[name, address && (name ? `(${address})` : address)].filter(Boolean).join(' ')}`)
  }
  lines.push(`📅 ${formatDate(camp.date)}${dday ? ` · ${dday}` : ''}`)
  lines.push(`👥 ${camp.members.map((m) => m.name).join(', ')} (${camp.members.length}명)`)
  const schedule = scheduleGroups(sortSchedule(camp.schedule ?? []))
  if (schedule.length) {
    lines.push('')
    lines.push('🕒 일정')
    for (const group of schedule) {
      if (schedule.length > 1 || group.day > 1) lines.push(`[${group.day}일차 · ${formatDayDate(camp.date, group.day)}]`)
      for (const item of group.items) lines.push(`${item.time} ${item.title}`)
    }
  }
  lines.push('')
  lines.push('🎒 누가 무엇을 챙기나요')
  for (const member of camp.members) {
    if (!member.equipments.length) {
      lines.push(`• ${member.name}: 없음`)
      continue
    }
    const items = sortByCategory(member.equipments).map((e) => (e.quantity > 1 ? `${equipmentLabel(e)} ×${e.quantity}` : equipmentLabel(e)))
    lines.push(`• ${member.name}: ${items.join(', ')}`)
  }
  lines.push('')
  lines.push('— Camping&Joy')
  return lines.join('\n')
}
