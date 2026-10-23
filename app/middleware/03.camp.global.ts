import { CAMP_STEPS, type CampStep } from '~/constants/steps'
import campSteps from '~/utils/campSteps'

// /g/[groupId]/camps/[campId]/... 로 들어오면 해당 캠핑을 현재 캠핑으로 선택한다. 없는 캠핑이면 모임의 캠핑 목록으로 보낸다.
// 앞 단계를 다 입력하지 않았으면 들어갈 수 있는 마지막 단계로 보낸다.
export default defineNuxtRouteMiddleware((to) => {
  const campId = to.params.campId
  if (typeof campId !== 'string') return

  const store = useCampStore()
  const group = useGroupStore()
  if (!store.selectCamp(campId) || !store.currentCamp) return navigateTo(group.path())

  const step = CAMP_STEPS.find((s) => to.path.endsWith(`/${s.path}`))
  if (step && !campSteps.canVisitStep(store.currentCamp, step.path as CampStep['path'])) {
    return navigateTo(group.path(`/camps/${campId}/${campSteps.lastVisitableStep(store.currentCamp)}`))
  }
})
