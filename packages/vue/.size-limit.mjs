// Size budgets: gzip bytes of what a user's bundler keeps, with Vue and motion-v excluded.
// `pnpm --filter vccs size` checks them. scripts/check-bundle.mjs reads the chart list from here,
// so a new chart gets a budget and a standalone-bundle check from one row.

/** Typical compositions: a chart with its usual axes, grid, tooltip and legend. */
export const presets = [
  { name: 'Area chart', import: '{ AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip }', limit: '84.7 kB' },
  { name: 'Bar chart', import: '{ BarChart, Bar, XAxis, YAxis, Tooltip, Legend }', limit: '87.8 kB' },
  { name: 'Pie chart', import: '{ PieChart, Pie, Tooltip }', limit: '70.8 kB' },
]

/**
 * One row per chart export. `standalone` charts render without the cartesian engine, so their
 * bundles must not keep its modules (checked by `pnpm check:bundle --assert-standalone`).
 */
export const charts = [
  { name: 'AreaChart', limit: '48.2 kB' },
  { name: 'BarChart', limit: '48.2 kB' },
  { name: 'LineChart', limit: '48.2 kB' },
  { name: 'ComposedChart', limit: '48.2 kB' },
  { name: 'ScatterChart', limit: '48.2 kB' },
  { name: 'PieChart', limit: '48.3 kB' },
  { name: 'RadarChart', limit: '48.3 kB' },
  { name: 'RadialBarChart', limit: '48.3 kB' },
  { name: 'FunnelChart', limit: '48.2 kB' },
  { name: 'Treemap', limit: '29.8 kB', standalone: true },
  { name: 'Sankey', limit: '30.3 kB', standalone: true },
  { name: 'SunburstChart', limit: '29.3 kB', standalone: true },
  { name: 'Tracker', limit: '26.1 kB', standalone: true },
  { name: 'Heatmap', limit: '26.8 kB', standalone: true },
  { name: 'CohortChart', limit: '27.5 kB', standalone: true },
  { name: 'CalendarHeatmap', limit: '27.1 kB', standalone: true },
  { name: 'JourneySankey', limit: '27.9 kB', standalone: true },
  { name: 'BarList', limit: '8.2 kB', standalone: true },
  { name: 'Sparkline', limit: '30.5 kB', standalone: true },
]

export default [
  ...presets,
  ...charts.map(({ name, limit }) => ({ name, import: `{ ${name} }`, limit })),
].map(row => ({ ...row, path: 'dist/es/index.mjs', gzip: true, ignore: ['vue', 'motion-v'] }))
