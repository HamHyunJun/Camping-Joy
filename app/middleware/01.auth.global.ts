// 로그인하지 않았으면 로그인 화면으로, 프로필을 정하지 않았으면 프로필 화면으로 보낸다. 서버 설정이 없으면(기기에만 저장) 로그인을 요구하지 않는다.
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  await auth.init()
  if (!auth.enabled) return
  if (to.path === '/login') return auth.user ? navigateTo('/') : undefined
  if (!auth.user) return navigateTo('/login')
  await auth.loadProfile()
  if (!auth.profile?.nickname && to.path !== '/profile') return navigateTo('/profile')
})
