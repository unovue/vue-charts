const repository = 'https://github.com/unovue/vue-charts'

export default defineAppConfig({
  seo: {
    title: 'vccs',
    description: 'Vue 3 charting components — an unofficial port of Recharts',
  },
  header: {
    title: 'vccs',
    logo: {
      light: '/logo.svg',
      dark: '/logo.svg',
      alt: 'vccs logo',
    },
  },
  github: {
    url: repository,
  },
  toc: {
    bottom: {
      title: 'Community',
      links: [
        {
          icon: 'i-lucide-star',
          label: 'Star on GitHub',
          to: repository,
          target: '_blank',
        },
      ],
    },
  },
  ui: {
    colors: {
      neutral: 'zinc',
    },
  },
})
