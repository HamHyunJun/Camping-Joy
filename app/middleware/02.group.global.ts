// /g/[groupId]/... 로 들어오면 그 모임을 현재 모임으로 정하고, 그 모임의 멤버·장비·캠핑을 불러온다.
// 소속이 아니면(가입 신청 중 포함) 모임 목록으로 보낸다. 서버 설정이 없으면(기기에만 저장) 모임 없이 쓴다.
export default defineNuxtRouteMiddleware(async (to) => {
  const nuxtApp = useNuxtApp()
  const group = useGroupStore()
  const groupId = to.params.groupId
  // 서버 설정이 없으면 모임 목록 없이 기기에만 저장하는 하나의 모임으로 쓴다.
  if (to.path === '/' && !useAuthStore().enabled) return navigateTo('/g/local')
  if (typeof groupId !== 'string') {
    group.currentGroupId = undefined
    return
  }
  if (!useAuthStore().enabled) {
    group.currentGroupId = groupId
    return
  }

  if (!group.loaded) await group.loadGroups()
  const role = group.roleIn(groupId)
  if (!role || role === 'pending') return navigateTo('/')

  if (group.currentGroupId !== groupId) {
    group.currentGroupId = groupId
    group.members = []
    await Promise.all([group.loadMembers(), nuxtApp.$gearSync.connect(groupId), nuxtApp.$campSync.connect(groupId)])
  }
})
