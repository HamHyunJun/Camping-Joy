import type { Equipment, Person } from '~/types/camp'
import type { EquipmentRow, PersonRow } from '~/types/database'

// 모임의 멤버·장비 등록을 서버(Supabase)에 저장해서, 어느 기기에서 들어와도 같은 목록을 보게 한다.
// 모임 안으로 들어올 때 group.global 미들웨어가 connect()를 불러 그 모임의 목록으로 바꾼다.
// - 이 기기에서 고치면: 마지막으로 서버와 맞춘 내용(baseline)과 비교해 바뀐 것만 올리고 지운 것만 지운다.
// - 다른 기기에서 고치면: 실시간 알림이나 화면으로 돌아올 때 서버 목록을 다시 받아 바꾼다.
// 서버가 설정돼 있지 않으면 이 플러그인은 아무것도 하지 않고 기기에만 저장된다.
export default defineNuxtPlugin(() => {
  const supabase = useSupabase()
  if (!supabase) return
  const db = supabase
  const gear = useGearStore()

  type PersonInsert = Omit<PersonRow, 'created_at'>
  type EquipmentInsert = Omit<EquipmentRow, 'created_at'>

  interface GearRows {
    persons: PersonInsert[]
    equipments: EquipmentInsert[]
  }

  const toRows = (people: Person[], groupId: string): GearRows => {
    const persons: PersonInsert[] = people.map((p) => ({
      id: p.id,
      group_id: groupId,
      name: p.name.slice(0, 20),
      user_id: p.userId ?? null,
    }))
    const equipments: EquipmentInsert[] = people.flatMap((p) =>
      p.equipments.map((e) => ({
        id: e.id,
        person_id: p.id,
        name: e.name.slice(0, 30),
        category: e.category,
        size: e.size?.slice(0, 20) ?? null,
        model: e.model?.slice(0, 30) ?? null,
        quantity: Math.min(Math.max(e.quantity, 1), 99),
      })),
    )
    return { persons, equipments }
  }

  const keyed = <T extends { id: string }>(rows: T[]): Map<string, string> => {
    return new Map(rows.map((row) => [row.id, JSON.stringify(row)]))
  }

  /** 지금 연결된 모임 */
  let groupId: string | undefined
  /** 서버와 마지막으로 맞춘 내용 */
  let baseline = { persons: new Map<string, string>(), equipments: new Map<string, string>() }
  let ready = false
  let pushing: Promise<void> | undefined
  let pushTimer: ReturnType<typeof setTimeout> | undefined
  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  let channel: ReturnType<typeof db.channel> | undefined

  const fetchPeople = async (id: string): Promise<Person[]> => {
    const persons = await db.from('people').select('*').eq('group_id', id).order('created_at').order('name')
    if (persons.error) throw persons.error
    const equipments = persons.data.length
      ? await db.from('equipments').select('*').in('person_id', persons.data.map((p) => p.id)).order('created_at').order('name')
      : { data: [], error: undefined }
    if (equipments.error) throw equipments.error
    const accounts = await db.from('person_accounts').select('*').eq('group_id', id)
    if (accounts.error) throw accounts.error
    return persons.data.map((p) => ({
      id: p.id,
      name: p.name,
      ...(p.user_id ? { userId: p.user_id } : {}),
      ...(accounts.data.some((a) => a.person_id === p.id)
        ? { sharedUserIds: accounts.data.filter((a) => a.person_id === p.id).map((a) => a.user_id) }
        : {}),
      equipments: equipments.data
        .filter((e) => e.person_id === p.id)
        .map((e): Equipment => ({
          id: e.id,
          name: e.name,
          category: e.category,
          quantity: e.quantity,
          ...(e.size ? { size: e.size } : {}),
          ...(e.model ? { model: e.model } : {}),
          ownerId: p.id,
        })),
    }))
  }

  const apply = (people: Person[], id: string): void => {
    const rows = toRows(people, id)
    baseline = { persons: keyed(rows.persons), equipments: keyed(rows.equipments) }
    if (JSON.stringify(people) !== JSON.stringify(gear.people)) gear.replacePeople(people)
  }

  const push = async (): Promise<void> => {
    if (!groupId) return
    const rows = toRows(gear.people, groupId)
    const persons = rows.persons.filter((r) => baseline.persons.get(r.id) !== JSON.stringify(r))
    const equipments = rows.equipments.filter((r) => baseline.equipments.get(r.id) !== JSON.stringify(r))
    const personIds = new Set(rows.persons.map((r) => r.id))
    const equipmentIds = new Set(rows.equipments.map((r) => r.id))
    const removedPersons = [...baseline.persons.keys()].filter((id) => !personIds.has(id))
    // 사람을 지우면 장비는 서버에서 함께 지워진다.
    const removedEquipments = [...baseline.equipments.entries()]
      .filter(([id, json]) => !equipmentIds.has(id) && !removedPersons.includes((JSON.parse(json) as EquipmentInsert).person_id))
      .map(([id]) => id)

    if (persons.length) {
      const { error } = await db.from('people').upsert(persons)
      if (error) throw error
    }
    if (equipments.length) {
      const { error } = await db.from('equipments').upsert(equipments)
      if (error) throw error
    }
    if (removedEquipments.length) {
      const { error } = await db.from('equipments').delete().in('id', removedEquipments)
      if (error) throw error
    }
    if (removedPersons.length) {
      const { error } = await db.from('people').delete().in('id', removedPersons)
      if (error) throw error
    }
    baseline = { persons: keyed(rows.persons), equipments: keyed(rows.equipments) }
  }

  const schedulePush = (): void => {
    if (!ready) return
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
      pushTimer = undefined
      pushing = push()
        .catch(() => {
          // 권한이 없거나 인터넷이 안 되면 다음에 서버 목록을 받을 때 서버 기준으로 되돌린다.
          scheduleRefresh()
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
      const people = await fetchPeople(id)
      if (id === groupId) apply(people, id)
    } catch {
      // 인터넷이 안 되면 기기에 있는 목록을 그대로 쓴다.
    }
  }

  function scheduleRefresh(): void {
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
    baseline = { persons: new Map(), equipments: new Map() }
  }

  /** 모임에 연결한다. 이 기기에 있던 다른 모임의 목록은 비우고 이 모임의 목록으로 바꾼다. */
  const connect = async (id: string): Promise<void> => {
    if (groupId === id) return
    disconnect()
    gear.people = []
    try {
      const people = await fetchPeople(id)
      groupId = id
      apply(people, id)
      ready = true
    } catch {
      // 서버에 닿지 않으면 빈 목록으로 두고, 모임에 다시 들어올 때 다시 시도한다.
      return
    }
    channel = db
      .channel(`gear-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'people', filter: `group_id=eq.${id}` }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipments' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'person_accounts', filter: `group_id=eq.${id}` }, scheduleRefresh)
      .subscribe()
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ready) scheduleRefresh()
  })
  watch(() => gear.people, schedulePush, { deep: true })

  return { provide: { gearSync: { connect, disconnect } } }
})
