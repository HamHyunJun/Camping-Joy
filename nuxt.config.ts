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
  runtimeConfig: {
    public: {
      supabaseUrl: '',
      supabaseKey: '',
      // 네이버 지도(NCP Maps) Client ID. 비어 있으면 지도 없이 '네이버 지도에서 보기' 링크만 보여 준다.
      naverMapKeyId: '',
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
