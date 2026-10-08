import type { Camp } from '~/types/camp'
import type { CampRow } from '~/types/database'

// 캠핑(정보·멤버·배분·준비 체크)을 서버(Supabase)에 저장해서, 누가 들어와도 전체 캠핑을 보게 한다.
// 멤버·장비 등록 동기화(gearSync)와 같은 방식이다.
// - 이 기기에서 고치면: 마지막으로 서버와 맞춘 내용(baseline)과 비교해 바뀐 캠핑만 올리고, 지운 캠핑만 지운다.
// - 다른 기기에서 고치면: 실시간 알림이나 화면으로 돌아올 때 서버 목록을 다시 받는다.
// 이름도 멤버도 없는 빈 캠핑('새 캠핑'만 누른 상태)은 올리지 않는다.
export default defineNuxtPlugin(() => {
  const supabase = useSupabase()
  if (!supabase) return
  const db = supabase
  const store = useCampStore()

  function isDraft(camp: Camp): boolean {
    return !camp.name.trim() && !camp.members.length
  }

  function toRow(camp: Camp): CampRow {
    return {
      id: camp.id,
      name: camp.name.slice(0, 50),
      date: camp.date,
      data: {
        members: camp.members,
        requiredEquipments: camp.requiredEquipments,
        assignments: camp.assignments,
        readyItems: camp.readyItems ?? [],
        schedule: camp.schedule ?? [],
        place: camp.place,
      },
      created_at: camp.createdAt,
      updated_at: camp.updatedAt,
    }
  }

  function fromRow(row: CampRow): Camp {
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
      synced: true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  /** 서버와 마지막으로 맞춘 내용 (캠핑 id → 행 JSON) */
  let baseline = new Map<string, string>()
  let ready = false
  let pushing: Promise<void> | null = null
  let pushTimer: ReturnType<typeof setTimeout> | null = null
  let refreshTimer: ReturnType<typeof setTimeout> | null = null

  async function fetchCamps(): Promise<CampRow[]> {
    const { data, error } = await db.from('camps').select('*').order('created_at')
    if (error) throw error
    return data
  }

  function apply(rows: CampRow[]) {
    baseline = new Map(rows.map((row) => [row.id, JSON.stringify(toRow(fromRow(row)))]))
    store.replaceCamps(rows.map(fromRow))
  }

  async function push() {
    const rows = store.camps.filter((camp) => !isDraft(camp)).map(toRow)
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

  function schedulePush() {
    if (!ready) return
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
      pushTimer = null
      pushing = push()
        .catch(() => {
          // 인터넷이 안 되면 다음에 고칠 때 다시 올린다.
        })
        .finally(() => (pushing = null))
    }, 600)
  }

  async function refresh() {
    // 이 기기에서 고친 내용을 올리는 중이면 끝난 뒤에 받는다.
    if (pushTimer || pushing) {
      await pushing
      if (pushTimer) return
    }
    try {
      apply(await fetchCamps())
    } catch {
      // 인터넷이 안 되면 기기에 있는 캠핑을 그대로 쓴다.
    }
  }

  function scheduleRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(refresh, 300)
  }

  async function start() {
    try {
      // 처음 연결한 기기는 그동안 기기에만 있던 캠핑을 서버에 올릴 수 있도록 '아직 안 올림'으로 둔다.
      if (!store.syncedOnce) {
        for (const camp of store.camps) camp.synced = false
        store.syncedOnce = true
      }
      apply(await fetchCamps())
      ready = true
      // 아직 서버에 없는 이 기기의 캠핑을 올린다.
      await push()
    } catch {
      // 서버에 닿지 않으면 다음에 앱을 열 때 다시 시도한다.
      if (!ready) return
    }

    db.channel('camps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camps' }, scheduleRefresh)
      .subscribe()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') scheduleRefresh()
    })
  }

  watch(() => store.camps, schedulePush, { deep: true })
  start()
})
