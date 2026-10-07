import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

/** 안드로이드 뒤로가기 버튼: 앞 화면이 있으면 돌아가고, 홈이면 앱을 닫는다. */
export default defineNuxtPlugin(() => {
  if (Capacitor.getPlatform() !== 'android') return
  const router = useRouter()
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && router.currentRoute.value.path !== '/') router.back()
    else App.exitApp()
  })
})
