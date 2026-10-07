// 링크로 공유한 캠핑은 기기에서 고칠 때마다 서버에도 다시 올려서, 링크로 보는 사람에게 최신 내용이 보이게 한다.
export default defineNuxtPlugin(() => {
  const sharing = useCampSharing()
  if (!sharing.enabled) return

  const store = useCampStore()
  const gear = useGearStore()
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  /** 공유한 캠핑마다 서버에 올라가는 내용(캠핑, 멤버 등록 장비)을 문자열로 */
  const snapshots = computed(() => {
    const result = new Map<string, string>()
    for (const camp of store.camps) {
      if (!camp.remote) continue
      const owned = camp.members.map((m) => gear.findPerson(m.id)?.equipments ?? [])
      result.set(camp.id, JSON.stringify([camp.name, camp.date, camp.members, camp.readyItems, owned]))
    }
    return result
  })

  watch(snapshots, (next, previous) => {
    for (const [campId, snapshot] of next) {
      // 방금 처음 올린 캠핑(이전 값 없음)은 다시 올릴 필요가 없다.
      if (!previous?.has(campId) || previous.get(campId) === snapshot) continue
      clearTimeout(timers.get(campId))
      timers.set(
        campId,
        setTimeout(async () => {
          const camp = store.camps.find((c) => c.id === campId)
          if (!camp?.remote) return
          try {
            const token = await sharing.uploadCamp(camp, gear.people)
            store.setRemote(campId, token)
          } catch {
            // 인터넷이 안 될 때는 다음 수정 때 다시 올린다.
          }
        }, 1500),
      )
    }
  })
})
