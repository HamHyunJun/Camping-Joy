import type { Camp, Equipment } from '~/types/camp'
import { EQUIPMENT_CATEGORY_LABELS } from '~/constants/equipment'
import format from '~/utils/format'
import equipmentLabel from '~/utils/equipmentLabel'

const categoryOrder = Object.keys(EQUIPMENT_CATEGORY_LABELS)

const sortByCategory = (list: Equipment[]): Equipment[] =>
  [...list].sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))

export default {
  /** 공유용으로 카테고리 순서대로 정렬한 장비 목록 */
  sortByCategory(list: Equipment[]): Equipment[] {
    return sortByCategory(list)
  },

  /** 메신저에 붙여 넣기 좋은 짧은 결과 문구. 멤버별로 챙길 장비를 한 줄씩 적는다. */
  buildShareText(camp: Camp): string {
    const lines: string[] = []
    const dday = format.formatDday(camp.date)
    lines.push(`⛺ ${camp.name || '이름 없는 캠핑'}`)
    if (camp.place) {
      const { name, address } = camp.place
      lines.push(`📍 ${[name, address && (name ? `(${address})` : address)].filter(Boolean).join(' ')}`)
    }
    lines.push(`📅 ${format.formatDate(camp.date)}${dday ? ` · ${dday}` : ''}`)
    lines.push(`👥 ${camp.members.map((m) => m.name).join(', ')} (${camp.members.length}명)`)
    const schedule = format.scheduleGroups(format.sortSchedule(camp.schedule ?? []))
    if (schedule.length) {
      lines.push('')
      lines.push('🕒 일정')
      for (const group of schedule) {
        if (schedule.length > 1 || group.day > 1) lines.push(`[${group.day}일차 · ${format.formatDayDate(camp.date, group.day)}]`)
        for (const item of group.items) lines.push(`${item.time} ${item.title}`)
      }
    }
    const menus = format.scheduleGroups(format.sortMeals((camp.menus ?? []).filter((m) => m.menu)))
    if (menus.length) {
      lines.push('')
      lines.push('🍽 음식')
      for (const group of menus) {
        for (const meal of group.items) lines.push(`${group.day}일차 ${meal.type}: ${meal.menu}`)
      }
    }
    if (camp.shopping?.length) {
      lines.push('')
      lines.push('🛒 장볼 것')
      lines.push(camp.shopping.map((s) => s.name).join(', '))
    }
    lines.push('')
    lines.push('🎒 누가 무엇을 챙기나요')
    for (const member of camp.members) {
      if (!member.equipments.length) {
        lines.push(`• ${member.name}: 없음`)
        continue
      }
      const items = sortByCategory(member.equipments).map((e) =>
        e.quantity > 1 ? `${equipmentLabel.equipmentLabel(e)} ×${e.quantity}` : equipmentLabel.equipmentLabel(e),
      )
      lines.push(`• ${member.name}: ${items.join(', ')}`)
    }
    lines.push('')
    lines.push('— Camping&Joy')
    return lines.join('\n')
  },
}
