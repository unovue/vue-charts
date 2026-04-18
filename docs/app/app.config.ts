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
  socials: {
    github: 'https://github.com/unovue/vue-charts',
  },
  github: {
    url: 'https://github.com/unovue/vue-charts',
  },
  toc: {
    bottom: {
      title: 'Community',
      links: [
        {
          icon: 'i-lucide-star',
          label: 'Star on GitHub',
          to: 'https://github.com/unovue/vue-charts',
          target: '_blank',
        },
      ],
    },
  },
  ui: {
    colors: {
      primary: 'orange',
      neutral: 'zinc',
    },
  },
})
