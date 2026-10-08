import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // 스토어에 올린 뒤에는 바꿀 수 없다.
  appId: 'com.campingjoy.app',
  appName: 'Camping&Joy',
  // `pnpm generate`가 만든 정적 파일을 앱 안에 넣는다. 캠핑장처럼 인터넷이 약한 곳에서도 열린다.
  webDir: '.output/public',
  plugins: {
    SystemBars: {
      // 화면 가장자리까지 그리고, 상·하단 바 높이는 CSS 변수(--safe-area-inset-*)로 받는다.
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      // 앱 배경이 밝으므로 상태 바·내비게이션 바 아이콘을 어둡게
      style: 'LIGHT',
    },
  },
}

export default config
