export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt'],
  // 기본값(쿠키)은 4KB 제한이 있어 캠핑이 쌓이면 저장이 깨진다.
  piniaPluginPersistedstate: {
    storage: 'localStorage',
  },
  // 캠핑 링크 공유용 Supabase. 비어 있으면 공유 없이 기기에만 저장한다.
  // Vercel 환경 변수 NUXT_PUBLIC_SUPABASE_URL, NUXT_PUBLIC_SUPABASE_KEY(anon/publishable 키)로 채운다.
  // 앱(Capacitor)은 빌드할 때 이 환경 변수를 넣어야 공유를 쓸 수 있다.
  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabaseKey: '',
      // 앱에서 만든 캠핑 링크가 가리킬 웹 주소
      siteUrl: 'https://camping-joy.vercel.app',
    },
  },
  css: ['~/assets/scss/main.scss'],
  vite: {
    css: {
      preprocessorOptions: {
        // 모든 SCSS에서 @include mobile / @include pc 를 쓸 수 있게 한다.
        scss: { additionalData: '@use "~/assets/scss/breakpoints" as *;\n' },
      },
    },
  },
  typescript: {
    strict: true,
  },
  app: {
    head: {
      title: 'Camping&Joy',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: '캠핑 장비를 멤버들에게 나눠 맡기고 한눈에 확인하는 서비스' },
        { name: 'theme-color', content: '#ffffff' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
})
