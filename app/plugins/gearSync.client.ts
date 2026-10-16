import type { Equipment, Person } from '~/types/camp'
import type { EquipmentRow, PersonRow } from '~/types/database'

// 멤버·장비 등록을 서버(Supabase)에 저장해서, 어느 기기에서 들어와도 같은 목록을 보게 한다.
// - 이 기기에서 고치면: 마지막으로 서버와 맞춘 내용(baseline)과 비교해 바뀐 것만 올리고 지운 것만 지운다.
// - 다른 기기에서 고치면: 실시간 알림이나 화면으로 돌아올 때 서버 목록을 다시 받아 바꾼다.
// 서버가 설정돼 있지 않거나 인터넷이 안 되면 지금처럼 기기에만 저장된다.
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

  const toRows = (people: Person[]): GearRows => {
    const persons: PersonInsert[] = people.map((p) => ({ id: p.id, name: p.name.slice(0, 20) }))
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

  /** 서버와 마지막으로 맞춘 내용 */
  let baseline = { persons: new Map<string, string>(), equipments: new Map<string, string>() }
  let ready = false
  let pushing: Promise<void> | undefined
  let pushTimer: ReturnType<typeof setTimeout> | undefined
  let refreshTimer: ReturnType<typeof setTimeout> | undefined

  const fetchPeople = async (): Promise<Person[]> => {
    const [persons, equipments] = await Promise.all([
      db.from('people').select('*').order('created_at').order('name'),
      db.from('equipments').select('*').order('created_at').order('name'),
    ])
    if (persons.error) throw persons.error
    if (equipments.error) throw equipments.error
    return persons.data.map((p) => ({
      id: p.id,
      name: p.name,
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

  const apply = (people: Person[]): void => {
    const rows = toRows(people)
    baseline = { persons: keyed(rows.persons), equipments: keyed(rows.equipments) }
    if (JSON.stringify(people) !== JSON.stringify(gear.people)) gear.replacePeople(people)
  }

  const push = async (): Promise<void> => {
    const rows = toRows(gear.people)
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
          // 인터넷이 안 되면 다음에 고칠 때 다시 올린다.
        })
        .finally(() => (pushing = undefined))
    }, 600)
  }

  const refresh = async (): Promise<void> => {
    // 이 기기에서 고친 내용을 올리는 중이면 끝난 뒤에 받는다.
    if (pushTimer || pushing) {
      await pushing
      if (pushTimer) return
    }
    try {
      apply(await fetchPeople())
    } catch {
      // 인터넷이 안 되면 기기에 있는 목록을 그대로 쓴다.
    }
  }

  const scheduleRefresh = (): void => {
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(refresh, 300)
  }

  const start = async (): Promise<void> => {
    try {
      let people = await fetchPeople()
      // 처음 연결한 기기는 그동안 기기에만 있던 등록을 서버 목록에 더한다(같은 이름은 서버 것을 쓴다).
      if (!gear.syncedOnce) {
        const names = new Set(people.map((p) => p.name))
        const ids = new Set(people.map((p) => p.id))
        const local = gear.people.filter((p) => !ids.has(p.id) && !names.has(p.name))
        // 같은 이름이 서버에 이미 있으면 서버 사람으로 합치고, 이 기기 캠핑의 멤버도 그 사람으로 바꾼다.
        for (const person of gear.people) {
          const same = people.find((p) => p.name === person.name && p.id !== person.id)
          if (same) useCampStore().remapPerson(person.id, same.id)
        }
        if (local.length) {
          const rows = toRows(local)
          const { error } = await db.from('people').upsert(rows.persons)
          if (error) throw error
          if (rows.equipments.length) {
            const { error: equipmentError } = await db.from('equipments').upsert(rows.equipments)
            if (equipmentError) throw equipmentError
          }
          people = await fetchPeople()
        }
        gear.syncedOnce = true
      }
      apply(people)
      ready = true
    } catch {
      // 서버에 닿지 않으면 다음에 앱을 열 때 다시 시도한다.
      return
    }

    db.channel('gear')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'people' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipments' }, scheduleRefresh)
      .subscribe()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') scheduleRefresh()
    })
  }

  watch(() => gear.people, schedulePush, { deep: true })
  start()
})
