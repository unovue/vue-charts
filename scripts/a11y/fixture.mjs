// Data and chart cases for the SSR, hydration and accessibility audit (check-a11y.mjs).
import { createSSRApp, h, ref } from 'vue'
// eslint-disable-next-line antfu/no-import-dist -- exercise the built public package
import * as C from '../../packages/vue/dist/es/index.mjs'

export const names = [
  'BarChart',
  'LineChart',
  'AreaChart',
  'ComposedChart',
  'PieChart',
  'RadarChart',
  'RadialBarChart',
  'ScatterChart',
  'FunnelChart',
  'Treemap',
  'Sankey',
  'SunburstChart',
  'Tracker',
  'Heatmap',
  'CohortChart',
  'CalendarHeatmap',
  'JourneySankey',
  'BarList',
  'Sparkline',
  'Tooltip',
  'Legend',
  'Brush',
]
const data = [
  { name: 'Alpha', value: 10, x: 10, y: 20 },
  { name: 'Beta', value: 25, x: 20, y: 10 },
  { name: 'Gamma', value: 15, x: 30, y: 30 },
]

export function app(name, variant = 'default') {
  const hidden = ref([])
  const events = {
    'onRow-click': (row, index) => globalThis.rowClicks?.push({ row, index }),
    'onNode-click': (node, index) => globalThis.nodeClicks?.push({ node, index }),
  }
  function render() {
    const size = { width: 560, height: 300, isAnimationActive: false }
    const tooltip = () => h(C.Tooltip, { isAnimationActive: false })
    const series = (name, props = {}) => h(C[name], {
      dataKey: 'value',
      isAnimationActive: false,
      ...props,
    })
    let root = name
    let props = { ...size, ...events }
    let children = [tooltip()]
    const cartesian = ['BarChart', 'LineChart', 'AreaChart', 'ComposedChart']
    if ([...cartesian, 'Tooltip', 'Legend', 'Brush'].includes(name)) {
      root = cartesian.includes(name) ? name : 'BarChart'
      props.data = data
      children = [
        h(C.XAxis, { dataKey: 'name' }),
        h(C.YAxis),
        ...(root === 'ComposedChart'
          ? [series('Area'), series('Bar'), series('Line')]
          : [series(root.replace('Chart', ''))]),
        tooltip(),
        h(C.Legend, {
          'hidden': hidden.value,
          'onUpdate:hidden': (value) => { hidden.value = value },
        }),
      ]
      if (name === 'Brush')
        children.push(h(C.Brush, { dataKey: 'name', height: 30 }))
    }
    else if (name === 'PieChart' || name === 'FunnelChart') {
      children = [series(name.replace('Chart', ''), { data, nameKey: 'name' }), tooltip()]
    }
    else if (name === 'RadarChart') {
      props.data = data
      children = [h(C.PolarGrid), h(C.PolarAngleAxis, { dataKey: 'name' }), h(C.PolarRadiusAxis), series('Radar'), tooltip()]
    }
    else if (name === 'RadialBarChart') {
      props.data = data
      children = [series('RadialBar'), tooltip()]
    }
    else if (name === 'ScatterChart') {
      children = [h(C.XAxis, { dataKey: 'x', type: 'number' }), h(C.YAxis, { dataKey: 'y', type: 'number' }), series('Scatter', { data }), tooltip()]
    }
    else if (name === 'Treemap') {
      props = { ...props, data, dataKey: 'value', nameKey: 'name' }
    }
    else if (name === 'Sankey') {
      props.data = {
        nodes: [{ name: 'Start' }, { name: 'End' }, { name: 'Exit' }],
        links: [{ source: 0, target: 1, value: 10 }, { source: 0, target: 2, value: 5 }],
      }
    }
    else if (name === 'SunburstChart') {
      props.data = { name: 'All', value: 50, children: [
        { name: 'Alpha', value: 25, children: [{ name: 'Child', value: 10 }] },
        { name: 'Beta', value: 25 },
      ] }
    }
    else if (name === 'Tracker') {
      props.data = [
        { date: '2025-01-01', status: 'up' },
        { date: '2025-01-02', status: 'down' },
        { date: '2025-01-03', status: 'degraded' },
      ]
    }
    else if (name === 'Heatmap') {
      props = { ...props, showValues: true, data: [
        { x: 'Mon', y: 'AM', value: 10 },
        { x: 'Tue', y: 'AM', value: 20 },
        { x: 'Mon', y: 'PM', value: 5 },
        { x: 'Tue', y: 'PM', value: 15 },
      ] }
    }
    else if (name === 'CohortChart') {
      props.data = [{ cohort: 'Jan', values: [100, 70, 40] }, { cohort: 'Feb', values: [100, 50] }]
    }
    else if (name === 'CalendarHeatmap') {
      props = { ...props, start: '2025-01-01', end: '2025-02-28', data: [
        { date: '2025-01-02', value: 5 },
        { date: '2025-01-03', value: 10 },
      ] }
    }
    else if (name === 'JourneySankey') {
      props.data = [{ path: ['/', '/docs', '/signup'], count: 10 }, { path: ['/', '/about'], count: 5 }]
    }
    else if (name === 'BarList') {
      props.data = data
    }
    else if (name === 'Sparkline') {
      props.data = data.map(row => row.value)
    }
    if (variant === 'opaque')
      props.colors = ['#ffffff', '#0a0a0a']
    if (variant === 'nested' || variant === 'translucent') {
      props.colors = ['var(--fixture-fill, #ffffff)']
      props.style = {
        '--fixture-fill': variant === 'nested' ? '#0a0a0a' : 'rgba(10,10,10,0.2)',
        '--v-charts-label-foreground': variant === 'nested' ? '#ffffff' : 'var(--ds-text)',
      }
    }
    return h(C[root], props, { default: () => children })
  }
  return createSSRApp({ render })
}
