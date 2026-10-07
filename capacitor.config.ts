import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // 스토어에 올린 뒤에는 바꿀 수 없다.
  appId: 'com.campingjoy.app',
  appName: 'Camping&Joy',
  // `pnpm generate`가 만든 정적 파일을 앱 안에 넣는다. 캠핑장처럼 인터넷이 약한 곳에서도 열린다.
  webDir: '.output/public',
}

export default config
