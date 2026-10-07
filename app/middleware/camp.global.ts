// /camps/[campId]/... 로 들어오면 해당 캠핑을 현재 캠핑으로 선택한다. 없는 캠핑이면 목록으로 보낸다.
export default defineNuxtRouteMiddleware((to) => {
  const campId = to.params.campId
  if (typeof campId !== 'string') return

  const store = useCampStore()
  if (!store.selectCamp(campId)) return navigateTo('/')
})
