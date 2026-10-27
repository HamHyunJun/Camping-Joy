import navDepth from '~/utils/navDepth'

// 모바일에서 더 깊은 화면으로 들어가면 오른쪽에서 밀려 들어오고, 돌아가면 오른쪽으로 밀려 나간다.
// 같은 깊이끼리 옮길 때(탭 전환, 캠핑 단계 이동)는 효과가 없다. 실제 애니메이션은 main.scss가 html[data-nav]로 정한다.
// 가장자리에서 오른쪽으로 쓸면 뒤로 간다.
const EDGE = 24
const SWIPE_DISTANCE = 70
const SWIPE_DRIFT = 60

export default defineNuxtPlugin(() => {
  const router = useRouter()
  const mobile = window.matchMedia('(max-width: 1080px)')
  const root = document.documentElement

  router.beforeEach((to, from) => {
    const delta = navDepth.depthOf(to.path) - navDepth.depthOf(from.path)
    root.dataset.nav = mobile.matches && delta ? (delta > 0 ? 'forward' : 'back') : 'none'
  })

  let start: { x: number; y: number } | undefined

  document.addEventListener(
    'touchstart',
    (event) => {
      const touch = event.touches[0]
      start = touch && event.touches.length === 1 && touch.clientX <= EDGE ? { x: touch.clientX, y: touch.clientY } : undefined
    },
    { passive: true },
  )

  document.addEventListener(
    'touchend',
    (event) => {
      const touch = event.changedTouches[0]
      const from = start
      start = undefined
      if (!from || !touch || !mobile.matches || document.querySelector('dialog[open]')) return
      const dx = touch.clientX - from.x
      const dy = Math.abs(touch.clientY - from.y)
      // 첫 화면이나 직접 열어 돌아갈 곳이 없으면 아무 일도 하지 않는다.
      if (dx > SWIPE_DISTANCE && dy < SWIPE_DRIFT && window.history.state?.back) router.back()
    },
    { passive: true },
  )
})
