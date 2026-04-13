export default defineNuxtConfig({
  extends: ['docus'],
  css: ['~/assets/main.css'],
  components: [
    {
      path: '~/components',
      global: true,
    },
  ],
})
