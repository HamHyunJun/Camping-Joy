export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt'],
  css: ['~/assets/scss/main.scss'],
  typescript: {
    strict: true,
  },
  app: {
    head: {
      title: 'CampPack',
      htmlAttrs: { lang: 'ko' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: '캠핑 장비를 멤버들에게 나눠 맡기고 한눈에 확인하는 서비스' },
      ],
    },
  },
})
