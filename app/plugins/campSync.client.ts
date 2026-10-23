import type { Camp } from '~/types/camp'
import type { CampRow } from '~/types/database'

// 모임의 캠핑(정보·멤버·배분·준비 체크)을 서버(Supabase)에 저장해서, 모임 구성원이 같은 캠핑을 보게 한다.
// 멤버·장비 등록 동기화(gearSync)와 같은 방식이고, 모임 안으로 들어올 때 group.global 미들웨어가 connect()를 부른다.
// - 이 기기에서 고치면: 마지막으로 서버와 맞춘 내용(baseline)과 비교해 바뀐 캠핑만 올리고, 지운 캠핑만 지운다.
// - 다른 기기에서 고치면: 실시간 알림이나 화면으로 돌아올 때 서버 목록을 다시 받는다.
// 이름도 멤버도 없는 빈 캠핑('새 캠핑'만 누른 상태)은 올리지 않는다.
export default defineNuxtPlugin(() => {
  const supabase = useSupabase()
  if (!supabase) return
  const db = supabase
  const store = useCampStore()

  const isDraft = (camp: Camp): boolean => {
    return !camp.name.trim() && !camp.members.length
  }

  const toRow = (camp: Camp, groupId: string): CampRow => {
    return {
      id: camp.id,
      group_id: groupId,
      name: camp.name.slice(0, 50),
      date: camp.date,
      data: {
        members: camp.members,
        requiredEquipments: camp.requiredEquipments,
        assignments: camp.assignments,
        readyItems: camp.readyItems ?? [],
        schedule: camp.schedule ?? [],
        place: camp.place,
        menus: camp.menus,
        shopping: camp.shopping ?? [],
      },
      created_at: camp.createdAt,
      updated_at: camp.updatedAt,
    }
  }

  const fromRow = (row: CampRow): Camp => {
    return {
      id: row.id,
      name: row.name,
      date: row.date,
      members: row.data.members ?? [],
      requiredEquipments: row.data.requiredEquipments ?? [],
      assignments: row.data.assignments ?? [],
      readyItems: row.data.readyItems ?? [],
      schedule: row.data.schedule ?? [],
      place: row.data.place,
      menus: row.data.menus,
      shopping: row.data.shopping ?? [],
      synced: true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  /** 지금 연결된 모임 */
  let groupId: string | undefined
  /** 서버와 마지막으로 맞춘 내용 (캠핑 id → 행 JSON) */
  let baseline = new Map<string, string>()
  let ready = false
  let pushing: Promise<void> | undefined
  let pushTimer: ReturnType<typeof setTimeout> | undefined
  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  let channel: ReturnType<typeof db.channel> | undefined

  const fetchCamps = async (id: string): Promise<CampRow[]> => {
    const { data, error } = await db.from('camps').select('*').eq('group_id', id).order('created_at')
    if (error) throw error
    return data
  }

  const apply = (rows: CampRow[], id: string): void => {
    baseline = new Map(rows.map((row) => [row.id, JSON.stringify(toRow(fromRow(row), id))]))
    store.replaceCamps(rows.map(fromRow))
  }

  const push = async (): Promise<void> => {
    if (!groupId) return
    const id = groupId
    const rows = store.camps.filter((camp) => !isDraft(camp)).map((camp) => toRow(camp, id))
    const changed = rows.filter((row) => baseline.get(row.id) !== JSON.stringify(row))
    const ids = new Set(store.camps.map((camp) => camp.id))
    const removed = [...baseline.keys()].filter((id) => !ids.has(id))
    if (changed.length) {
      const { error } = await db.from('camps').upsert(changed)
      if (error) throw error
    }
    if (removed.length) {
      const { error } = await db.from('camps').delete().in('id', removed)
      if (error) throw error
    }
    for (const id of removed) baseline.delete(id)
    for (const row of changed) baseline.set(row.id, JSON.stringify(row))
    store.markSynced(changed.map((row) => row.id))
  }

  const schedulePush = (): void => {
    if (!ready) return
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
      pushTimer = undefined
      pushing = push()
        .catch(() => {
          // 인터넷이 안 되면 다음에 고칠 때 다시 올린다.
        })
        .finally(() => (pushing = undefined))
    }, 600)
  }

  const refresh = async (): Promise<void> => {
    const id = groupId
    if (!id) return
    // 이 기기에서 고친 내용을 올리는 중이면 끝난 뒤에 받는다.
    if (pushTimer || pushing) {
      await pushing
      if (pushTimer) return
    }
    try {
      const rows = await fetchCamps(id)
      if (id === groupId) apply(rows, id)
    } catch {
      // 인터넷이 안 되면 기기에 있는 캠핑을 그대로 쓴다.
    }
  }

  const scheduleRefresh = (): void => {
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(refresh, 300)
  }

  const disconnect = (): void => {
    groupId = undefined
    ready = false
    if (pushTimer) clearTimeout(pushTimer)
    if (refreshTimer) clearTimeout(refreshTimer)
    pushTimer = refreshTimer = undefined
    if (channel) db.removeChannel(channel)
    channel = undefined
    baseline = new Map()
  }

  /** 모임에 연결한다. 이 기기에 있던 다른 모임의 캠핑은 비우고 이 모임의 캠핑으로 바꾼다. */
  const connect = async (id: string): Promise<void> => {
    if (groupId === id) return
    disconnect()
    store.camps = []
    store.currentCampId = undefined
    try {
      const rows = await fetchCamps(id)
      groupId = id
      apply(rows, id)
      ready = true
    } catch {
      // 서버에 닿지 않으면 빈 목록으로 두고, 모임에 다시 들어올 때 다시 시도한다.
      return
    }
    channel = db
      .channel(`camps-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camps', filter: `group_id=eq.${id}` }, scheduleRefresh)
      .subscribe()
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ready) scheduleRefresh()
  })
  watch(() => store.camps, schedulePush, { deep: true })

  return { provide: { campSync: { connect, disconnect } } }
})
