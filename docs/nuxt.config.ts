export default defineNuxtConfig({
  extends: ['docus'],
  css: ['~/assets/main.css'],
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
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
