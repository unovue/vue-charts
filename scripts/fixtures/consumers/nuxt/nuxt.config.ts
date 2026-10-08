export default defineNuxtConfig({
  modules: ['vccs/nuxt'],
  devtools: { enabled: false },
  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: { skipLibCheck: true },
      vueCompilerOptions: { strictTemplates: true, dataAttributes: ['data-slot', 'data-chart'] },
    },
  },
})
