export default defineNuxtConfig({
  extends: ['docus'],
  vite: {
    // Docus' robots and og-image runtimes import nuxt/app without declaring nuxt, so they get
    // whichever copy pnpm hoists; another workspace package's newer nuxt breaks the build.
    resolve: { dedupe: ['nuxt'] },
  },
  css: ['~/assets/main.css'],
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap' },
      ],
    },
  },
  components: [
    {
      path: '~/components',
      global: true,
    },
  ],
})
