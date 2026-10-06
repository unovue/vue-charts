export default defineNuxtConfig({
  modules: ['vccs/nuxt'],
  devtools: { enabled: false },
  typescript: { strict: true, tsConfig: { compilerOptions: { skipLibCheck: true } } },
})
