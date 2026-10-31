// The libraries in the comparison: one source for the site, the bundle harness and the docs.
// `omits` lists what a card's chart leaves out, `note` says why on the card and `noteSource` backs it.
// compare-libraries.mjs tests the animation claim in a browser, so a wrong one fails the run.
// `builds` are the bundles it measures.

const line = { chart: 'line' }

export const libraries = [
  {
    id: 'vccs',
    name: 'vccs',
    packages: ['vccs', 'motion-v'],
    renderer: 'SVG',
    license: 'MIT',
    docs: 'https://vue-charts.com',
    omits: [],
    builds: [
      { ...line, id: 'default', label: 'vccs with motion-v, its required animation peer' },
      { ...line, id: 'motion-external', label: 'vccs only, for an app that already ships motion-v', external: ['motion-v'], reference: true },
    ],
  },
  {
    id: 'chartjs',
    name: 'Chart.js',
    packages: ['chart.js', 'vue-chartjs'],
    renderer: 'Canvas',
    license: 'MIT',
    docs: 'https://vue-chartjs.org',
    omits: [],
    builds: [{ ...line, id: 'default', label: 'vue-chartjs + chart.js, registered components only, and a small crosshair plugin' }],
  },
  {
    id: 'echarts',
    name: 'Apache ECharts',
    packages: ['echarts', 'vue-echarts'],
    renderer: 'Canvas',
    license: 'Apache-2.0',
    docs: 'https://vue-echarts.dev',
    omits: [],
    builds: [{ ...line, id: 'default', label: 'vue-echarts + echarts/core, registered components only' }],
  },
  {
    id: 'unovis',
    name: 'Unovis',
    packages: ['@unovis/ts', '@unovis/vue'],
    renderer: 'SVG',
    license: 'Apache-2.0',
    docs: 'https://unovis.dev',
    omits: [],
    builds: [{ ...line, id: 'default', label: '@unovis/vue + @unovis/ts' }],
  },
  {
    id: 'tanstack',
    name: 'TanStack Charts',
    packages: ['@tanstack/charts', 'd3-shape'],
    renderer: 'SVG',
    license: 'MIT',
    docs: 'https://tanstack.com/charts',
    omits: [],
    builds: [
      { ...line, id: 'default', label: '@tanstack/charts/vue with svgAnimation, d3Curve(curveMonotoneX) and crosshair' },
      { id: 'defaults', source: 'reference-defaults.vue', label: 'Library defaults: straight lines, no crosshair, no animation', reference: true, omits: ['animation'] },
    ],
  },
  {
    id: 'ag-charts',
    name: 'AG Charts Community',
    packages: ['ag-charts-community', 'ag-charts-vue3'],
    renderer: 'Canvas',
    license: 'MIT',
    docs: 'https://www.ag-grid.com/charts/vue/quick-start/',
    omits: ['crosshair', 'animation'],
    note: 'The crosshair and animation are Enterprise features, so this free edition measures without them.',
    noteSource: 'https://www.ag-grid.com/charts/vue/community-vs-enterprise/',
    builds: [{ ...line, id: 'default', label: 'ag-charts-vue3 + ag-charts-community, registered modules only' }],
  },
  {
    id: 'vue-data-ui',
    name: 'vue-data-ui',
    packages: ['vue-data-ui'],
    renderer: 'SVG',
    license: 'MIT',
    docs: 'https://vue-data-ui.graphieros.com',
    omits: [],
    builds: [{ ...line, id: 'default', label: 'vue-data-ui/vue-ui-xy and its stylesheet' }],
  },
  {
    id: 'plot',
    name: 'Observable Plot',
    packages: ['@observablehq/plot'],
    renderer: 'SVG',
    license: 'ISC',
    docs: 'https://observablehq.com/plot/',
    omits: ['animation'],
    note: 'Plot redraws the chart on each change; its source has no built-in transitions.',
    noteSource: 'https://github.com/observablehq/plot/tree/v0.6.17/src',
    builds: [{ ...line, id: 'default', label: '@observablehq/plot mounted in onMounted, with a pointer rule as the crosshair' }],
  },
  {
    id: 'vega-lite',
    name: 'Vega-Lite',
    packages: ['vega-lite', 'vega', 'vega-embed'],
    renderer: 'SVG or Canvas',
    license: 'BSD-3-Clause',
    docs: 'https://vega.github.io/vega-lite/',
    omits: ['animation'],
    note: 'This chart redraws on each change. Vega-Lite can play frames through data with its time encoding, which this chart does not use.',
    noteSource: 'https://github.com/vega/vega-lite/blob/main/CHANGELOG.md',
    builds: [{ ...line, id: 'default', label: 'vega-embed + vega-lite + vega, with a rule as the crosshair' }],
  },
]

/** React library, measured for API and bundle parity only: no live card and no feature column. */
export const reference = {
  id: 'recharts',
  name: 'Recharts',
  packages: ['recharts'],
  license: 'MIT',
  docs: 'https://recharts.org',
  omits: [],
  builds: [{ id: 'default', source: 'Chart.jsx', framework: 'react', label: 'recharts, React external; vccs is its Vue port', reference: true }],
}
