// The libraries in the comparison: one source for the site, the bundle harness and the docs.
// `limits` holds, per chart, what its card leaves out (`omits`), why (`note`) and the proof (`noteSource`).
// compare-libraries.mjs and compare-cards.mjs test the animation claim in a browser, so a wrong one fails.
// `builds` are the bundles it measures; only the line chart is measured, as the size benchmark.
// `tooltipNames` are the names a chart's tooltip must show; compare-cards.mjs reads them from the page.

export const charts = [
  { id: 'line', title: 'Line', description: 'three smooth lines, axes, a legend, a shared tooltip, a crosshair and animation' },
  { id: 'area', title: 'Area', description: 'three stacked smooth areas, axes, a legend, a shared tooltip, a crosshair and animation' },
  { id: 'bar', title: 'Bar', description: 'three grouped series over long category labels, axes, a legend, a tooltip and animation' },
  { id: 'stacked-bar', title: 'Stacked bar', description: 'three stacked series over long category labels, axes, a legend, a tooltip and animation' },
  { id: 'composed', title: 'Composed', description: 'bars, a line and an area on shared axes, a legend, a shared tooltip and animation' },
  { id: 'scatter', title: 'Scatter', description: 'two groups of points on numeric axes, a legend, a tooltip and animation' },
  { id: 'pie', title: 'Donut', description: 'four slices with a hole, a legend, a tooltip and animation' },
  { id: 'radar', title: 'Radar', description: 'two series over six axes, a legend, a tooltip and animation' },
  { id: 'radial-bar', title: 'Radial bar', description: 'four concentric bars, a legend or labels, a tooltip and animation' },
  { id: 'treemap', title: 'Treemap', description: 'eight tiles in three groups, labels, a tooltip and animation' },
  { id: 'sankey', title: 'Sankey', description: 'six nodes and six links, labels, a tooltip and animation' },
  { id: 'funnel', title: 'Funnel', description: 'four stages, labels or a legend, a tooltip and animation' },
]

const series = ['Desktop', 'Mobile', 'Tablet']
const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge']
const tooltipNames = {
  'line': series,
  'area': series,
  'bar': series,
  'stacked-bar': series,
  'composed': series,
  // x and y are this chart's data, unlike the layout coordinates a wrong tooltip shows on the others.
  'scatter': [...series, 'x', 'y'],
  'pie': browsers,
  'radar': series,
  'radial-bar': browsers,
  'treemap': ['Line', 'Bar', 'Pie', 'XAxis', 'YAxis', 'Curve', 'Sector', 'Dot'],
  'sankey': ['Visit', 'Sign up', 'Left', 'Onboarding', 'Active', 'Churned'],
  'funnel': ['Visit', 'Sign up', 'Checkout', 'Purchase'],
}

const line = { chart: 'line' }
for (const chart of charts)
  chart.tooltipNames = tooltipNames[chart.id]
const chartIds = charts.map(chart => chart.id)
/** The same limit on some charts. A limit with `unsupported` gets a placeholder card instead of a chart. */
const on = (ids, limit) => Object.fromEntries(ids.map(id => [id, limit]))
const unsupported = (note, noteSource) => ({ unsupported: true, note, noteSource })
const chartjsControllers = 'https://github.com/chartjs/Chart.js/tree/v4.6.1/src/controllers'
const chartjsPlugins = 'https://github.com/chartjs/awesome'
const unovisComponents = 'https://github.com/f5/unovis/tree/1.7.1/packages/ts/src/components'
const plotMarks = 'https://github.com/observablehq/plot/tree/v0.6.17/src/marks'
const vegaMarks = 'https://vega.github.io/vega-lite/docs/mark.html'
const vueDataUiStill = page => ({ omits: ['animation'], note: 'This chart drew no in-between frames on load or on new data when measured.', noteSource: `https://vue-data-ui.graphieros.com/docs#${page}` })
const agPaid = (name, page) => unsupported(`${name} are an Enterprise feature; the free edition has no such series.`, `https://www.ag-grid.com/charts/vue/${page}/`)

export const libraries = [
  {
    id: 'vccs',
    name: 'vccs',
    packages: ['vccs', 'motion-v'],
    renderer: 'SVG',
    license: 'MIT',
    docs: 'https://vue-charts.com',
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
    limits: {
      'radial-bar': unsupported('Chart.js has no radial bar type; polar area is a different chart.', chartjsControllers),
      'treemap': unsupported('Chart.js needs the third-party chartjs-chart-treemap plugin for this.', chartjsPlugins),
      'sankey': unsupported('Chart.js needs the third-party chartjs-chart-sankey plugin for this.', chartjsPlugins),
      'funnel': unsupported('Chart.js needs the third-party chartjs-chart-funnel plugin for this.', chartjsPlugins),
    },
    builds: [{ ...line, id: 'default', label: 'vue-chartjs + chart.js, registered components only, and a small crosshair plugin' }],
  },
  {
    id: 'echarts',
    name: 'Apache ECharts',
    packages: ['echarts', 'vue-echarts'],
    renderer: 'Canvas',
    license: 'Apache-2.0',
    docs: 'https://vue-echarts.dev',
    builds: [{ ...line, id: 'default', label: 'vue-echarts + echarts/core, registered components only' }],
  },
  {
    id: 'unovis',
    name: 'Unovis',
    packages: ['@unovis/ts', '@unovis/vue'],
    renderer: 'SVG',
    license: 'Apache-2.0',
    docs: 'https://unovis.dev',
    limits: {
      radar: unsupported('Unovis has no radar component.', unovisComponents),
      funnel: unsupported('Unovis has no funnel component.', unovisComponents),
    },
    builds: [{ ...line, id: 'default', label: '@unovis/vue + @unovis/ts' }],
  },
  {
    id: 'tanstack',
    name: 'TanStack Charts',
    packages: ['@tanstack/charts', 'd3-shape'],
    renderer: 'SVG',
    license: 'MIT',
    docs: 'https://tanstack.com/charts',
    limits: {
      funnel: unsupported('TanStack Charts has no funnel mark.', 'https://tanstack.com/charts/latest/docs/reference/marks'),
    },
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
    limits: {
      ...on(chartIds, {
        omits: ['crosshair', 'animation'],
        note: 'The crosshair and animation are Enterprise features, so this free edition goes without them.',
        noteSource: 'https://www.ag-grid.com/charts/vue/community-vs-enterprise/',
      }),
      'radar': agPaid('Radar series', 'radar-line-series'),
      'radial-bar': agPaid('Radial bar series', 'radial-bar-series'),
      'treemap': agPaid('Treemaps', 'treemap-series'),
      'sankey': agPaid('Sankey diagrams', 'sankey-series'),
      'funnel': agPaid('Funnels', 'funnel-series'),
    },
    builds: [{ ...line, id: 'default', label: 'ag-charts-vue3 + ag-charts-community, registered modules only' }],
  },
  {
    id: 'vue-data-ui',
    name: 'vue-data-ui',
    packages: ['vue-data-ui'],
    renderer: 'SVG',
    license: 'MIT',
    docs: 'https://vue-data-ui.graphieros.com',
    limits: {
      scatter: vueDataUiStill('vue-ui-scatter'),
      radar: vueDataUiStill('vue-ui-radar'),
      treemap: vueDataUiStill('vue-ui-treemap'),
      sankey: vueDataUiStill('vue-ui-flow'),
      funnel: { omits: ['tooltip'], note: 'VueUiFunnel has no tooltip option; it labels each stage directly.', noteSource: 'https://vue-data-ui.graphieros.com/docs#vue-ui-funnel' },
    },
    builds: [{ ...line, id: 'default', label: 'vue-data-ui/vue-ui-xy and its stylesheet' }],
  },
  {
    id: 'plot',
    name: 'Observable Plot',
    packages: ['@observablehq/plot'],
    renderer: 'SVG',
    license: 'ISC',
    docs: 'https://observablehq.com/plot/',
    limits: {
      ...on(chartIds, {
        omits: ['animation'],
        note: 'Plot redraws the chart on each change; its source has no built-in transitions.',
        noteSource: 'https://github.com/observablehq/plot/tree/v0.6.17/src',
      }),
      'pie': unsupported('Plot has no arc mark, so it has no pie or donut.', plotMarks),
      'radar': unsupported('Plot has no radar mark.', plotMarks),
      'radial-bar': unsupported('Plot has no arc mark, so it has no radial bar.', plotMarks),
      'treemap': unsupported('Plot has no treemap mark.', plotMarks),
      'sankey': unsupported('Plot has no Sankey mark.', plotMarks),
      'funnel': unsupported('Plot has no funnel mark.', plotMarks),
    },
    builds: [{ ...line, id: 'default', label: '@observablehq/plot mounted in onMounted, with a pointer rule as the crosshair' }],
  },
  {
    id: 'vega-lite',
    name: 'Vega-Lite',
    packages: ['vega-lite', 'vega', 'vega-embed'],
    renderer: 'SVG or Canvas',
    license: 'BSD-3-Clause',
    docs: 'https://vega.github.io/vega-lite/',
    limits: {
      ...on(chartIds, {
        omits: ['animation'],
        note: 'This chart redraws on each change. Vega-Lite can play frames through data with its time encoding, which this chart does not use.',
        noteSource: 'https://github.com/vega/vega-lite/blob/main/CHANGELOG.md',
      }),
      radar: unsupported('Vega-Lite has no radar mark.', vegaMarks),
      treemap: unsupported('Vega-Lite has no treemap mark.', vegaMarks),
      sankey: unsupported('Vega-Lite has no Sankey mark.', vegaMarks),
      funnel: unsupported('Vega-Lite has no funnel mark.', vegaMarks),
    },
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
  builds: [{ id: 'default', source: 'Chart.jsx', framework: 'react', label: 'recharts, React external; vccs is its Vue port', reference: true }],
}
