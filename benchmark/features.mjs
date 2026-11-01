// The feature table: one rule per column, and a source for every cell at the tested version.
// `support` is yes, partial, no or unknown. "no" means looked for and not found, and `unknown` means
// the check could not be completed. check-comparison requires every cell; a person reads the links.

export const featuresCheckedAt = '2026-11-01'

export const featureColumns = [
  { id: 'rendering', title: 'Rendering', rule: 'What it draws to.' },
  { id: 'typescript', title: 'TypeScript', rule: 'Yes: the package ships its own type declarations.' },
  { id: 'ssr', title: 'SSR and Nuxt', rule: 'Yes: the Vue integration renders the chart on the server. Partial: a separate path or only some charts.' },
  { id: 'theming', title: 'Theming', rule: 'Yes: a theme system or CSS variables. Partial: per-chart options and global defaults only.' },
  { id: 'darkMode', title: 'Dark mode', rule: 'Yes: a documented approach. Partial: possible, with no documented switch.' },
  { id: 'animatedUpdates', title: 'Animated updates', rule: 'Yes: a data change animates by default. Partial: opt-in, or only on some charts.' },
  { id: 'responsive', title: 'Responsive', rule: 'Yes: follows its container by default. Partial: opt-in or width only.' },
  { id: 'composability', title: 'Composability', rule: 'Yes: Vue components. Partial: composable functions. No: one config object or spec.' },
  { id: 'a11y', title: 'Accessibility', rule: 'Yes: built-in ARIA and keyboard navigation. Partial: one of them, or only on some charts.' },
  { id: 'treeShaking', title: 'Tree-shaking', rule: 'Yes: unused parts are documented as excludable. Partial: named imports with a large shared core.' },
  { id: 'agentSupport', title: 'Agent support', rule: 'Yes: an official agent skill or MCP server. Partial: llms.txt or a demo only.' },
]

export const features = {
  'vccs': {
    rendering: {
      support: 'yes',
      value: 'SVG',
      source: 'https://github.com/unovue/vue-charts/blob/v1.0.0/packages/vue/src/container/Surface.tsx',
    },
    typescript: {
      support: 'yes',
      value: 'Ships its own type declarations',
      source: 'https://github.com/unovue/vue-charts/blob/v1.0.0/packages/vue/package.json',
    },
    ssr: {
      support: 'yes',
      value: 'Server-renders SVG; Nuxt module',
      source: 'https://github.com/unovue/vue-charts/blob/v1.0.0/docs/content/2.guides/11.nuxt-and-ssr.md',
    },
    theming: {
      support: 'yes',
      value: 'CSS variables, props and slots',
      source: 'https://github.com/unovue/vue-charts/blob/v1.0.0/docs/content/2.guides/15.theming.md',
    },
    darkMode: {
      support: 'yes',
      value: 'CSS variables on a parent element',
      source: 'https://github.com/unovue/vue-charts/blob/v1.0.0/docs/content/2.guides/15.theming.md',
    },
    animatedUpdates: {
      support: 'yes',
      value: 'Data changes animate by default',
      source: 'https://github.com/unovue/vue-charts/blob/v1.0.0/docs/content/2.guides/12.animation.md',
    },
    responsive: {
      support: 'yes',
      value: 'Fills container width; height from prop',
      source: 'https://github.com/unovue/vue-charts/blob/v1.0.0/docs/content/2.guides/05.chart-size.md',
    },
    composability: {
      support: 'yes',
      value: 'Vue components composed inside a chart',
      source: 'https://github.com/unovue/vue-charts/blob/v1.0.0/docs/content/1.getting-started/1.introduction.md',
    },
    a11y: {
      support: 'yes',
      value: 'Accessible name, keyboard, announcements; no data table',
      source: 'https://github.com/unovue/vue-charts/blob/v1.0.0/docs/content/2.guides/18.accessibility.md',
    },
    treeShaking: {
      support: 'yes',
      value: 'ES modules, sideEffects false; single entry',
      source: 'https://github.com/unovue/vue-charts/blob/v1.0.0/packages/vue/package.json',
    },
    agentSupport: {
      support: 'yes',
      value: 'Agent skill and llms.txt; no MCP server',
      source: 'https://github.com/unovue/vue-charts/blob/v1.0.0/skills/vccs-usage/SKILL.md',
    },
  },
  'chartjs': {
    rendering: {
      support: 'yes',
      value: 'Canvas',
      source: 'https://github.com/chartjs/Chart.js/blob/v4.6.1/docs/general/accessibility.md',
    },
    typescript: {
      support: 'yes',
      value: 'Ships its own type declarations',
      source: 'https://github.com/apertureless/vue-chartjs/blob/v5.3.4/package.json',
    },
    ssr: {
      support: 'no',
      value: 'Empty canvas on server; no Nuxt docs found',
      source: 'https://github.com/apertureless/vue-chartjs/blob/v5.3.4/src/chart.ts',
    },
    theming: {
      support: 'partial',
      value: 'Options, Chart.defaults; CSS variables not documented',
      source: 'https://github.com/chartjs/Chart.js/blob/v4.6.1/docs/general/colors.md',
    },
    darkMode: {
      support: 'partial',
      value: 'Pass dark colours yourself; no documented switch',
      source: 'https://github.com/chartjs/Chart.js/blob/v4.6.1/docs/general/colors.md',
    },
    animatedUpdates: {
      support: 'yes',
      value: 'Data changes animate by default',
      source: 'https://github.com/chartjs/Chart.js/blob/v4.6.1/docs/developers/updates.md',
    },
    responsive: {
      support: 'yes',
      value: 'On by default; needs dedicated positioned container',
      source: 'https://github.com/chartjs/Chart.js/blob/v4.6.1/docs/configuration/responsive.md',
    },
    composability: {
      support: 'no',
      value: 'One component per type; config object props',
      source: 'https://github.com/apertureless/vue-chartjs/blob/v5.3.4/README.md',
    },
    a11y: {
      support: 'partial',
      value: 'role=img, aria props; keyboard, data table not documented',
      source: 'https://github.com/apertureless/vue-chartjs/blob/v5.3.4/src/chart.ts',
    },
    treeShaking: {
      support: 'yes',
      value: 'Per-feature registration; chart.js/auto registers everything',
      source: 'https://github.com/chartjs/Chart.js/blob/v4.6.1/docs/getting-started/integration.md',
    },
    agentSupport: {
      support: 'no',
      value: 'None found; only third-party MCP servers seen',
      source: 'https://www.chartjs.org/docs/latest/',
    },
  },
  'echarts': {
    rendering: {
      support: 'yes',
      value: 'Canvas or SVG, chosen at init',
      source: 'https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/',
    },
    typescript: {
      support: 'yes',
      value: 'Ships own type declarations',
      source: 'https://github.com/ecomfe/vue-echarts/blob/v8.3.2/package.json#L16',
    },
    ssr: {
      support: 'partial',
      value: 'VChart renders container only; ECharts SSR separate',
      source: 'https://github.com/ecomfe/vue-echarts/blob/v8.3.2/README.md?plain=1#L111',
    },
    theming: {
      support: 'yes',
      value: 'Theme object and options; no Canvas CSS variables',
      source: 'https://github.com/apache/echarts/issues/19743',
    },
    darkMode: {
      support: 'yes',
      value: 'Built-in dark theme via theme prop',
      source: 'https://github.com/ecomfe/vue-echarts/blob/v8.3.2/README.md?plain=1#L37',
    },
    animatedUpdates: {
      support: 'yes',
      value: 'Data changes animate by default',
      source: 'https://echarts.apache.org/handbook/en/how-to/data/dynamic-data/',
    },
    responsive: {
      support: 'partial',
      value: 'Opt-in autoresize prop; default false',
      source: 'https://github.com/ecomfe/vue-echarts/blob/v8.3.2/README.md?plain=1#L185',
    },
    composability: {
      support: 'no',
      value: 'One VChart takes an option object',
      source: 'https://github.com/ecomfe/vue-echarts/blob/v8.3.2/README.md?plain=1#L159',
    },
    a11y: {
      support: 'partial',
      value: 'Opt-in role=img, generated aria-label; no keyboard documented',
      source: 'https://echarts.apache.org/handbook/en/best-practices/aria/',
    },
    treeShaking: {
      support: 'yes',
      value: 'Per-feature imports registered with use()',
      source: 'https://github.com/ecomfe/vue-echarts/blob/v8.3.2/README.md?plain=1#L89',
    },
    agentSupport: {
      support: 'partial',
      value: 'llms.txt on docs; Apache-hosted demo MCP server',
      source: 'https://echarts.apache.org/en/llms.txt',
    },
  },
  'unovis': {
    rendering: {
      support: 'yes',
      value: 'SVG; Leaflet map components also use canvas',
      source: 'https://github.com/f5/unovis/blob/1.7.1/packages/ts/src/core/container/index.ts',
    },
    typescript: {
      support: 'yes',
      value: 'Ships its own .d.ts declarations',
      source: 'https://github.com/f5/unovis/blob/1.7.1/packages/vue/package.json',
    },
    ssr: {
      support: 'partial',
      value: 'Vue components client-only; separate @unovis/ssr package',
      source: 'https://github.com/f5/unovis/tree/1.7.1/packages/ssr',
    },
    theming: {
      support: 'yes',
      value: '--vis-* CSS variables plus per-component props',
      source: 'https://unovis.dev/docs/guides/theming',
    },
    darkMode: {
      support: 'yes',
      value: 'Add theme-dark class to body; --vis-dark-* variables',
      source: 'https://unovis.dev/docs/guides/theming',
    },
    animatedUpdates: {
      support: 'yes',
      value: 'Yes; 600 ms transition by default',
      source: 'https://github.com/f5/unovis/blob/1.7.1/packages/ts/src/core/component/config.ts',
    },
    responsive: {
      support: 'yes',
      value: 'Fits parent via ResizeObserver; 300px default height',
      source: 'https://unovis.dev/docs/containers/XY_Container',
    },
    composability: {
      support: 'yes',
      value: 'Vue components composed inside a container',
      source: 'https://unovis.dev/docs/quick-start',
    },
    a11y: {
      support: 'partial',
      value: 'role=figure, ariaLabel prop; keyboard nav, data table undocumented',
      source: 'https://unovis.dev/docs/containers/XY_Container',
    },
    treeShaking: {
      support: 'yes',
      value: 'Tree-shakable root entry plus per-component subpaths',
      source: 'https://unovis.dev/docs/quick-start',
    },
    agentSupport: {
      support: 'yes',
      value: 'Official @unovis/mcp server; no llms.txt found live',
      source: 'https://unovis.dev/docs/mcp',
    },
  },
  'tanstack': {
    rendering: {
      support: 'yes',
      value: 'SVG by default; Canvas opt-in per mark',
      source: 'https://github.com/TanStack/charts/blob/v1.1.0/docs/framework/vue/adapter.md',
    },
    typescript: {
      support: 'yes',
      value: 'Ships its own type declarations',
      source: 'https://github.com/TanStack/charts/blob/v1.1.0/packages/charts-core/package.json',
    },
    ssr: {
      support: 'yes',
      value: 'Server-renders SVG; no Nuxt guidance documented',
      source: 'https://github.com/TanStack/charts/blob/v1.1.0/docs/framework/vue/adapter.md',
    },
    theming: {
      support: 'yes',
      value: 'CSS variables, theme object, per-mark style options',
      source: 'https://github.com/TanStack/charts/blob/v1.1.0/docs/guides/themes-and-styling.md',
    },
    darkMode: {
      support: 'yes',
      value: 'Inherits container CSS color; app sets dark values',
      source: 'https://github.com/TanStack/charts/blob/v1.1.0/docs/guides/themes-and-styling.md',
    },
    animatedUpdates: {
      support: 'partial',
      value: 'Off by default; opt in with svgAnimation',
      source: 'https://github.com/TanStack/charts/blob/v1.1.0/docs/reference/dom-host.md',
    },
    responsive: {
      support: 'yes',
      value: 'Follows container width; height from prop, ratio, CSS',
      source: 'https://github.com/TanStack/charts/blob/v1.1.0/docs/guides/responsive-charts.md',
    },
    composability: {
      support: 'partial',
      value: 'One Chart component; marks composed in definition object',
      source: 'https://github.com/TanStack/charts/blob/v1.1.0/docs/framework/vue/adapter.md',
    },
    a11y: {
      support: 'yes',
      value: 'ARIA image role, keyboard point navigation; table yours',
      source: 'https://github.com/TanStack/charts/blob/v1.1.0/docs/guides/accessibility.md',
    },
    treeShaking: {
      support: 'yes',
      value: 'Exact subpath imports per capability; ESM tree shaking',
      source: 'https://github.com/TanStack/charts/blob/v1.1.0/docs/guides/bundle-size-and-performance.md',
    },
    agentSupport: {
      support: 'yes',
      value: 'llms.txt and packaged agent skills',
      source: 'https://tanstack.com/charts/latest/llms.txt',
    },
  },
  'ag-charts': {
    rendering: {
      support: 'yes',
      value: 'Canvas',
      source: 'https://www.ag-grid.com/charts/vue/quick-start/',
    },
    typescript: {
      support: 'yes',
      value: 'Ships its own type declarations',
      source: 'https://github.com/ag-grid/ag-charts/blob/d35a5e835ce60330457c9b1cfb45781d580782f8/packages/ag-charts-vue3/package.json',
    },
    ssr: {
      support: 'no',
      value: 'Client-only in Vue; no Nuxt guidance documented',
      source: 'https://github.com/ag-grid/ag-charts/blob/d35a5e835ce60330457c9b1cfb45781d580782f8/packages/ag-charts-vue3/src/index.ts',
    },
    theming: {
      support: 'yes',
      value: 'Theme object, options; CSS variables for colour values',
      source: 'https://www.ag-grid.com/charts/vue/colours/',
    },
    darkMode: {
      support: 'yes',
      value: 'Stock -dark themes through the theme option',
      source: 'https://www.ag-grid.com/charts/vue/themes/',
    },
    animatedUpdates: {
      support: 'no',
      value: 'Data update animation is Enterprise-only',
      source: 'https://www.ag-grid.com/charts/vue/community-vs-enterprise/',
    },
    responsive: {
      support: 'yes',
      value: 'Auto-sizes to container and resizes with it',
      source: 'https://www.ag-grid.com/charts/vue/layout/',
    },
    composability: {
      support: 'no',
      value: 'One component takes one options object',
      source: 'https://github.com/ag-grid/ag-charts/blob/d35a5e835ce60330457c9b1cfb45781d580782f8/packages/ag-charts-vue3/src/index.ts',
    },
    a11y: {
      support: 'yes',
      value: 'Keyboard navigation, ARIA announcements; data table undocumented',
      source: 'https://www.ag-grid.com/charts/vue/accessibility/',
    },
    treeShaking: {
      support: 'yes',
      value: 'Per-feature modules registered through ModuleRegistry',
      source: 'https://www.ag-grid.com/charts/vue/module-registry/',
    },
    agentSupport: {
      support: 'yes',
      value: 'llms.txt and official skills; no Charts MCP documented',
      source: 'https://www.ag-grid.com/charts/vue/skills/',
    },
  },
  'vue-data-ui': {
    rendering: {
      support: 'yes',
      value: 'SVG; VueUiXyCanvas draws to Canvas',
      source: 'https://github.com/graphieros/vue-data-ui/blob/16fffe5247ddf0fc9854c9a65ef7a3dc7bece9a5/src/components/vue-ui-xy.vue#L7990',
    },
    typescript: {
      support: 'yes',
      value: 'Ships own declarations in dist/types',
      source: 'https://github.com/graphieros/vue-data-ui/blob/16fffe5247ddf0fc9854c9a65ef7a3dc7bece9a5/package.json#L98',
    },
    ssr: {
      support: 'partial',
      value: 'Static SVG helpers for two charts; else ClientOnly',
      source: 'https://github.com/graphieros/vue-data-ui-nuxt/blob/f2736e8807b48d3c9fd2fa0b1a2b5e983be1c9f5/pages/index.vue#L22',
    },
    theming: {
      support: 'yes',
      value: 'Config object with a theme option',
      source: 'https://github.com/graphieros/vue-data-ui/blob/16fffe5247ddf0fc9854c9a65ef7a3dc7bece9a5/README.md#L497',
    },
    darkMode: {
      support: 'yes',
      value: 'config.theme \'dark\'; you switch it',
      source: 'https://github.com/graphieros/vue-data-ui/blob/16fffe5247ddf0fc9854c9a65ef7a3dc7bece9a5/README.md#L497',
    },
    animatedUpdates: {
      support: 'partial',
      value: 'Varies by chart; some measured static here',
      source: 'https://github.com/graphieros/vue-data-ui/blob/16fffe5247ddf0fc9854c9a65ef7a3dc7bece9a5/src/useConfig.js#L1391',
    },
    responsive: {
      support: 'partial',
      value: 'Scales width by default; config.responsive for full',
      source: 'https://github.com/graphieros/vue-data-ui/blob/16fffe5247ddf0fc9854c9a65ef7a3dc7bece9a5/README.md#L939',
    },
    composability: {
      support: 'no',
      value: 'One component per chart; dataset and config props',
      source: 'https://github.com/graphieros/vue-data-ui/blob/16fffe5247ddf0fc9854c9a65ef7a3dc7bece9a5/README.md#L241',
    },
    a11y: {
      support: 'partial',
      value: 'ARIA label, arrow keys, hidden table; chart-dependent',
      source: 'https://github.com/graphieros/vue-data-ui/blob/16fffe5247ddf0fc9854c9a65ef7a3dc7bece9a5/README.md#L1451',
    },
    treeShaking: {
      support: 'yes',
      value: 'Per-chart subpath entries; root entry not tree-shaken',
      source: 'https://github.com/graphieros/vue-data-ui/blob/16fffe5247ddf0fc9854c9a65ef7a3dc7bece9a5/llms.txt#L54',
    },
    agentSupport: {
      support: 'partial',
      value: 'Publishes llms.txt; no official MCP server documented',
      source: 'https://vue-data-ui.graphieros.com/llms.txt',
    },
  },
  'plot': {
    rendering: {
      support: 'yes',
      value: 'SVG; HTML figure wrapper for legends, titles',
      source: 'https://github.com/observablehq/plot/blob/v0.6.17/docs/features/plots.md?plain=1#L257',
    },
    typescript: {
      support: 'yes',
      value: 'Ships its own declarations',
      source: 'https://github.com/observablehq/plot/blob/v0.6.17/docs/getting-started.md?plain=1#L128',
    },
    ssr: {
      support: 'partial',
      value: 'SSR via virtual document option; Nuxt not documented',
      source: 'https://github.com/observablehq/plot/blob/v0.6.17/docs/getting-started.md?plain=1#L222-L224',
    },
    theming: {
      support: 'yes',
      value: 'Per-chart options; CSS variables accepted as colours',
      source: 'https://github.com/observablehq/plot/blob/v0.6.17/src/options.js#L542',
    },
    darkMode: {
      support: 'partial',
      value: 'currentColor plus --plot-background; no documented toggle',
      source: 'https://github.com/observablehq/plot/blob/v0.6.17/CHANGELOG-2023.md?plain=1#L17-L27',
    },
    animatedUpdates: {
      support: 'no',
      value: 'No animated transitions; updates replace the plot',
      source: 'https://github.com/observablehq/plot/blob/v0.6.17/docs/features/interactions.md?plain=1#L69',
    },
    responsive: {
      support: 'partial',
      value: 'Shrinks via max-width; no resize re-layout documented',
      source: 'https://github.com/observablehq/plot/blob/v0.6.17/src/plot.d.ts#L11-L14',
    },
    composability: {
      support: 'partial',
      value: 'Marks compose as functions; no Vue components',
      source: 'https://github.com/observablehq/plot/blob/v0.6.17/docs/getting-started.md?plain=1#L274',
    },
    a11y: {
      support: 'partial',
      value: 'ARIA labels on marks; keyboard, table not documented',
      source: 'https://github.com/observablehq/plot/blob/v0.6.17/docs/features/accessibility.md?plain=1#L7',
    },
    treeShaking: {
      support: 'partial',
      value: 'Named imports from single entry; no subpath entries',
      source: 'https://github.com/observablehq/plot/blob/v0.6.17/package.json',
    },
    agentSupport: {
      support: 'unknown',
      value: 'Not confirmed; docs site blocked the check',
      source: 'https://github.com/observablehq/plot/tree/v0.6.17/docs',
    },
  },
  'vega-lite': {
    rendering: {
      support: 'yes',
      value: 'SVG by default in vega-embed; Canvas optional',
      source: 'https://github.com/vega/vega-embed/blob/v7.3.0/README.md',
    },
    typescript: {
      support: 'yes',
      value: 'Ships own declarations (vega-embed, vega-lite, vega)',
      source: 'https://github.com/vega/vega-embed/blob/v7.3.0/package.json',
    },
    ssr: {
      support: 'partial',
      value: 'embed() client-only; Node toSVG() available; no Nuxt docs',
      source: 'https://vega.github.io/vega/usage/',
    },
    theming: {
      support: 'yes',
      value: 'Config object, themes; CSS variables not documented',
      source: 'https://vega.github.io/vega-lite/docs/config.html',
    },
    darkMode: {
      support: 'yes',
      value: 'Built-in "dark" theme via embed option',
      source: 'https://github.com/vega/vega-themes/blob/v3.0.0/README.md',
    },
    animatedUpdates: {
      support: 'no',
      value: 'Not by default; data changes redraw without tween',
      source: 'https://github.com/vega/vega-lite/issues/9919',
    },
    responsive: {
      support: 'partial',
      value: 'Opt-in via width/height: "container" in spec',
      source: 'https://vega.github.io/vega-lite/docs/size.html',
    },
    composability: {
      support: 'no',
      value: 'No Vue components; one embed() call with spec',
      source: 'https://github.com/vega/vega-embed/blob/v7.3.0/README.md',
    },
    a11y: {
      support: 'partial',
      value: 'SVG ARIA labels; keyboard, table fallback not documented',
      source: 'https://vega.github.io/vega-lite/docs/config.html',
    },
    treeShaking: {
      support: 'no',
      value: 'Single entry; vega and vega-lite imported whole',
      source: 'https://github.com/vega/vega-embed/blob/v7.3.0/src/embed.ts',
    },
    agentSupport: {
      support: 'no',
      value: 'None found; third-party MCP servers only',
      source: 'https://github.com/orgs/vega/repositories',
    },
  },
}

/** npm downloads of each library's Vue entry for one fixed week, the reason these libraries are in the list. */
export const downloads = {
  week: '2026-10-19 to 2026-10-25',
  source: 'https://api.npmjs.org/downloads/point/2026-10-19:2026-10-25/',
  packages: {
    'vccs': { name: 'vccs', count: 5345 },
    'chartjs': { name: 'vue-chartjs', count: 595727 },
    'echarts': { name: 'vue-echarts', count: 330847 },
    'unovis': { name: '@unovis/vue', count: 122212 },
    'tanstack': { name: '@tanstack/charts', count: 506823, note: 'all frameworks' },
    'ag-charts': { name: 'ag-charts-vue3', count: 16228 },
    'vue-data-ui': { name: 'vue-data-ui', count: 4786 },
    'plot': { name: '@observablehq/plot', count: 539049, note: 'all frameworks' },
    'vega-lite': { name: 'vega-lite', count: 825975, note: 'all frameworks' },
  },
}

/** Popular libraries left out because of the rule that every library is free for commercial use. */
export const excluded = [
  {
    name: 'Highcharts',
    package: 'highcharts-vue',
    count: 79583,
    reason: 'Commercial use needs a paid licence.',
    source: 'https://shop.highcharts.com/license',
  },
  {
    name: 'ApexCharts',
    package: 'vue3-apexcharts',
    count: 208057,
    reason: 'Free under its Community License only below $2 million in annual revenue or equivalent resources; above that it needs a Commercial License.',
    source: 'https://apexcharts.com/license/',
  },
]

/** Libraries whose first-load size for the line chart is below vccs with its required peer. */
function smallerThanVccs(results, libraries) {
  const size = id => results.builds.find(build => build.library === id && build.build === 'default')?.gzipBytes ?? Infinity
  return libraries
    .filter(library => size(library.id) < size('vccs'))
    .toSorted((a, b) => size(a.id) - size(b.id))
    .map(library => library.name)
}

/** When vccs is the wrong choice. The size entry reads the measurements, so it cannot go stale. */
export function alternatives(results, libraries) {
  return [
    {
      need: 'Very large datasets',
      suggestion: 'ECharts or Chart.js',
      why: 'vccs draws every mark as an SVG element, which adds up as points grow, so a Canvas library is worth trying. This comparison does not benchmark runtime speed yet, so test with your own data.',
      source: 'https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/',
    },
    {
      need: 'The smallest first load',
      suggestion: smallerThanVccs(results, libraries).join(', '),
      why: 'These measured smaller than vccs with motion-v for the same line chart. vccs alone is smaller if your app already ships motion-v.',
      source: '#/line',
    },
    {
      need: 'More than one framework',
      suggestion: 'TanStack Charts or Unovis',
      why: 'vccs only works in Vue 3. Both of these have integrations for other frameworks, so several apps can share one charting library.',
      source: 'https://unovis.dev/docs/quick-start',
    },
    {
      need: 'Charts generated as data',
      suggestion: 'Vega-Lite',
      why: 'A chart is a JSON specification, which a server or a data tool can produce and store without Vue code.',
      source: 'https://vega.github.io/vega-lite/',
    },
    {
      need: 'Maps',
      suggestion: 'ECharts or Unovis',
      why: 'vccs has no map chart.',
      source: 'https://github.com/f5/unovis/tree/1.7.1/packages/ts/src/components',
    },
    {
      need: 'A vendor and paid support',
      suggestion: 'AG Charts Enterprise',
      why: 'vccs is an unofficial, community-maintained port. AG Charts sells an Enterprise edition, which this comparison does not test.',
      source: 'https://www.ag-grid.com/charts/vue/community-vs-enterprise/',
    },
  ]
}
