import type { Camp, ID, Person, SharedCamp, SharedItem } from '~/types/camp'
import type { Database } from '~/types/database'

/**
 * 캠핑 링크 공유. 서버(Supabase)가 설정돼 있지 않으면 쓸 수 없다(enabled = false).
 *
 * 서버 구조: camps(캠핑) → camp_members(멤버) → camp_gear(멤버 보유 장비) → camp_items(챙길 장비, 챙기는 사람 = 장비 주인)
 * 캠핑을 만든 기기가 기기의 캠핑을 서버에 그대로 올린다(uploadCamp). 서버 id는 기기 id에서 만들어서
 * 다시 올려도 같은 행을 고치고, 다른 기기가 고른 멤버("나는 민지")는 유지된다.
 */

/** 기기 id(캠핑마다 같은 사람·장비 id를 쓴다)를 캠핑별로 겹치지 않는 서버 uuid로 바꾼다. */
async function serverId(campId: ID, kind: 'member' | 'gear' | 'item', localId: ID): Promise<ID> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${campId}:${kind}:${localId}`)))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function notIn(ids: ID[]): string {
  return `(${ids.join(',')})`
}

/** 앱(웹뷰)에서는 주소가 기기 안 주소라서 배포 주소로 링크를 만든다. */
export function campLinkUrl(token: string): string {
  const { siteUrl } = useRuntimeConfig().public
  const origin = typeof window !== 'undefined' && window.location.protocol.startsWith('http') ? window.location.origin : siteUrl
  return `${origin}/c/${token}`
}

export function useCampSharing() {
  const supabase = useSupabase()
  const enabled = supabase !== null

  function client() {
    if (!supabase) throw new Error('서버가 설정되지 않았어요.')
    return supabase
  }

  /** 기기의 캠핑을 서버에 올리거나 고친다. 링크 토큰을 돌려준다. */
  async function uploadCamp(camp: Camp, people: Person[]): Promise<string> {
    const db = client()
    await ensureDeviceId()

    const { error: campError } = await db
      .from('camps')
      .upsert({ id: camp.id, name: (camp.name.trim() || '이름 없는 캠핑').slice(0, 50), date: camp.date })
    if (campError) throw campError

    // 멤버. device_id는 보내지 않아서 다른 기기가 고른 멤버가 그대로 남는다.
    const members = await Promise.all(
      camp.members.map(async (member, position) => ({
        id: await serverId(camp.id, 'member', member.id),
        camp_id: camp.id,
        name: member.name.slice(0, 20),
        position,
      })),
    )
    const memberIds = new Map(camp.members.map((member, index) => [member.id, members[index]!.id]))
    if (members.length) {
      const { error } = await db.from('camp_members').upsert(members)
      if (error) throw error
    }
    let removeMembers = db.from('camp_members').delete().eq('camp_id', camp.id)
    if (members.length) removeMembers = removeMembers.not('id', 'in', notIn(members.map((m) => m.id)))
    const { error: removeMembersError } = await removeMembers
    if (removeMembersError) throw removeMembersError

    // 멤버 보유 장비 (등록 목록 기준, 등록에 없는 사람은 챙길 장비로 대신)
    const gearRows: (Database['public']['Tables']['camp_gear']['Insert'] & { id: ID })[] = []
    const gearIds = new Map<ID, ID>()
    for (const member of camp.members) {
      const owned = people.find((p) => p.id === member.id)?.equipments ?? member.equipments.filter((e) => e.ownerId === member.id)
      for (const equipment of owned) {
        const id = await serverId(camp.id, 'gear', equipment.id)
        gearIds.set(equipment.id, id)
        gearRows.push({
          id,
          camp_id: camp.id,
          member_id: memberIds.get(member.id)!,
          name: equipment.name.slice(0, 30),
          category: equipment.category,
          size: equipment.size?.slice(0, 20) ?? null,
          quantity: Math.min(Math.max(equipment.quantity, 1), 99),
        })
      }
    }
    if (gearRows.length) {
      const { error } = await db.from('camp_gear').upsert(gearRows)
      if (error) throw error
    }
    let removeGear = db.from('camp_gear').delete().eq('camp_id', camp.id)
    if (gearRows.length) removeGear = removeGear.not('id', 'in', notIn(gearRows.map((g) => g.id)))
    const { error: removeGearError } = await removeGear
    if (removeGearError) throw removeGearError

    // 챙길 장비. 장비 하나는 한 줄로 합친다(챙기는 사람은 장비 주인).
    const itemMap = new Map<ID, { id: ID; camp_id: ID; gear_id: ID; quantity: number; ready: boolean }>()
    for (const member of camp.members) {
      for (const item of member.equipments) {
        const gearId = gearIds.get(item.id)
        if (!gearId) continue
        const gear = gearRows.find((g) => g.id === gearId)!
        const ready = camp.readyItems?.includes(`${member.id}:${item.id}`) ?? false
        const existing = itemMap.get(gearId)
        if (existing) {
          existing.quantity = Math.min(existing.quantity + item.quantity, gear.quantity)
          existing.ready = existing.ready && ready
        } else {
          itemMap.set(gearId, {
            id: await serverId(camp.id, 'item', item.id),
            camp_id: camp.id,
            gear_id: gearId,
            quantity: Math.min(item.quantity, gear.quantity),
            ready,
          })
        }
      }
    }
    const items = [...itemMap.values()]
    if (items.length) {
      const { error } = await db.from('camp_items').upsert(items)
      if (error) throw error
    }
    let removeItems = db.from('camp_items').delete().eq('camp_id', camp.id)
    if (items.length) removeItems = removeItems.not('id', 'in', notIn(items.map((i) => i.id)))
    const { error: removeItemsError } = await removeItems
    if (removeItemsError) throw removeItemsError

    const { data, error } = await db.from('camps').select('share_token').eq('id', camp.id).single()
    if (error) throw error
    return data.share_token
  }

  /** 링크로 캠핑을 연다. 링크가 틀렸거나 바뀌었으면 null. */
  async function loadSharedCamp(token: string): Promise<SharedCamp | null> {
    const db = client()
    const deviceId = await ensureDeviceId()
    const { data: campId, error: joinError } = await db.rpc('join_camp', { token })
    if (joinError) throw joinError
    if (!campId) return null

    const [campResult, membersResult, gearResult, itemsResult] = await Promise.all([
      db.from('camps').select('id, name, date, owner_id').eq('id', campId).single(),
      db.from('camp_members').select('id, name, position, device_id').eq('camp_id', campId).order('position'),
      db.from('camp_gear').select('id, member_id, name, category, size, quantity').eq('camp_id', campId),
      db.from('camp_items').select('id, gear_id, quantity, ready').eq('camp_id', campId),
    ])
    for (const result of [campResult, membersResult, gearResult, itemsResult]) if (result.error) throw result.error
    const camp = campResult.data!
    const gear = gearResult.data ?? []

    const members = (membersResult.data ?? []).map((member) => ({
      id: member.id,
      name: member.name,
      claimed: member.device_id !== null && member.device_id !== deviceId,
      mine: member.device_id !== null && member.device_id === deviceId,
      items: [] as SharedItem[],
    }))
    for (const item of itemsResult.data ?? []) {
      const owned = gear.find((g) => g.id === item.gear_id)
      const member = members.find((m) => m.id === owned?.member_id)
      if (!owned || !member) continue
      member.items.push({
        id: item.id,
        name: owned.name,
        category: owned.category,
        size: owned.size ?? undefined,
        quantity: item.quantity,
        ready: item.ready,
      })
    }
    return { id: camp.id, name: camp.name, date: camp.date, isOwner: camp.owner_id === deviceId, members }
  }

  /** "나는 민지". memberId가 null이면 선택을 취소한다. */
  async function claimMember(campId: ID, memberId: ID | null): Promise<void> {
    const { error } = await client().rpc('claim_member', { target_camp: campId, member: memberId })
    if (error) throw error
  }

  /** 만든 기기에서 캠핑을 지우면 서버의 캠핑도 지운다(링크도 더 이상 열리지 않는다). */
  async function deleteRemoteCamp(campId: ID): Promise<void> {
    const { error } = await client().from('camps').delete().eq('id', campId)
    if (error) throw error
  }

  return { enabled, uploadCamp, loadSharedCamp, claimMember, deleteRemoteCamp }
}
