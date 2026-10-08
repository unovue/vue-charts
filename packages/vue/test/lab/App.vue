<script setup>
import { computed, ref, shallowRef } from 'vue'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  BarList,
  Brush,
  CalendarHeatmap,
  CartesianGrid,
  CohortChart,
  ComposedChart,
  Funnel,
  FunnelChart,
  Heatmap,
  JourneySankey,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Sankey,
  Scatter,
  ScatterChart,
  Sparkline,
  SunburstChart,
  Tooltip,
  Tracker,
  Treemap,
  XAxis,
  YAxis,
  ZAxis,
} from 'vccs'

const scenario = new URLSearchParams(location.search).get('s') || 'bar'
// The static control supplies target geometry independently of the recorded animation.
const staticTarget = new URLSearchParams(location.search).has('static')
const dark = new URLSearchParams(location.search).get('dark') === '1'
if (dark)
  document.documentElement.classList.add('dark')

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan2', 'Feb2', 'Mar2']
const mk = (names, f) => names.map((name, i) => ({ name, a: f(i, 0), b: f(i, 1) }))
const base = (i, s) => Math.round(40 + 30 * Math.sin(i * 1.3 + s * 2) + s * 15)
const alt = (i, s) => Math.round(60 + 35 * Math.cos(i * 0.9 + s) - s * 10)

const heavy = { barMany: 91, lineMany: 365, brush: 60 }[scenario]
const days = Array.from({ length: 500 }, (_, i) => `d${i}`)
const rows = shallowRef(heavy ? mk(days.slice(0, heavy), base) : mk(months.slice(0, 6), base))
const hidden = ref([])
const heavySteps = [
  ['values', () => { rows.value = mk(rows.value.map(r => r.name), alt) }],
  ['shift', () => { const n = days.indexOf(rows.value.at(-1).name) + 1; rows.value = [...rows.value.slice(1), ...mk([days[n]], (i, s) => base(n, s))] }],
  ['hideA', () => { hidden.value = ['a'] }],
  ['showA', () => { hidden.value = [] }],
  ['fromOne', () => { rows.value = mk(days.slice(0, heavy), base) }],
  ['refill', () => { rows.value = mk(days.slice(0, heavy), base) }],
]
const width = ref(720)

// UTC arithmetic keeps the lab's ISO dates independent of the machine's timezone.
const isoDay = day => new Date(day * 86400000).toISOString().slice(0, 10)
const dayOf = iso => Date.parse(`${iso}T00:00:00Z`) / 86400000
const statuses = ['up', 'degraded', 'down', 'maintenance']
const trackerStart = dayOf('2025-01-01')
const trackerData = (start, count = 30) => Array.from({ length: count }, (_, i) => ({ date: isoDay(start + i), status: statuses[(start + i) % statuses.length] }))
const trackerRows = shallowRef(trackerData(trackerStart))
function shiftTracker(count) {
  const next = dayOf(trackerRows.value.at(-1).date) + 1
  trackerRows.value = [...trackerRows.value.slice(count), ...trackerData(next, count)]
}
const calendarStart = ref(dayOf('2025-01-01'))
const calendarEnd = ref(dayOf('2025-12-31'))
const weekStart = ref(0)
const calendarData = (variant = 0) => Array.from({ length: calendarEnd.value - calendarStart.value + 1 }, (_, i) => ({ date: isoDay(calendarStart.value + i), value: (i * 17 + variant * 23) % 101 }))
const calendarRows = shallowRef(calendarData())
function shiftCalendar(days) {
  calendarStart.value += days
  calendarEnd.value += days
  calendarRows.value = calendarData()
}

const heatDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hours = Array.from({ length: 24 }, (_, i) => i)
const heatX = shallowRef(hours)
const heatData = (days = heatDays, variant = 0) => days.flatMap((y, i) => hours.map(x => ({ x, y, value: (x * 13 + i * 19 + variant * 31) % 101 })))
const heatRows = shallowRef(heatData())
const cohortMode = ref('percent')
function cohortData(start = 0, variant = 0) {
  return Array.from({ length: 6 }, (_, i) => {
    const size = 800 + (start + i) * 137
    return { cohort: months[start + i], values: Array.from({ length: 6 - i }, (_, period) => Math.round(size * (period ? Math.max(0.1, 0.8 - period * 0.09 + variant * 0.04) : 1))) }
  })
}
const cohortRows = shallowRef(cohortData())
const sparkStart = trackerStart
const sparkData = (start, count = 30, variant = 0) => Array.from({ length: count }, (_, i) => ({ date: isoDay(start + i), value: Math.round(50 + 25 * Math.sin((start + i) * 0.7 + variant) + variant * 10) }))
const sparkRows = shallowRef(sparkData(sparkStart))
function shiftSpark(count) {
  const next = dayOf(sparkRows.value.at(-1).date) + 1
  sparkRows.value = [...sparkRows.value.slice(count), ...sparkData(next, count)]
}
const listData = () => months.slice(0, 6).map((name, i) => ({ name, value: 600 - i * 75 }))
const listRows = shallowRef(listData())

const journeyBase = [
  { path: ['/', '/pricing'], count: 6 },
  { path: ['/', '/pricing', '/', '/docs'], count: 1 },
  { path: ['/', '/pricing', '/', '/docs/guides/wordpress'], count: 1 },
  { path: ['/', '/pricing', '/docs/self-hosting'], count: 1 },
  { path: ['/', '/pricing', '/features/session-replay', '/features/web-analytics'], count: 1 },
  { path: ['/', '/pricing', '/docs/mcp', '/docs/hiding-own-traffic'], count: 1 },
  { path: ['/', '/docs'], count: 2 },
  { path: ['/', '/docs', '/pricing', '/features/session-replay'], count: 1 },
  { path: ['/de', '/de/pricing', '/de', '/de/compare/fathom'], count: 1 },
  { path: ['/de', '/de/pricing', '/de', '/de/pricing'], count: 1 },
  { path: ['/de', '/de/pricing', '/de'], count: 1 },
  { path: ['/de', '/features/web-analytics', '/de/docs/self-hosting', '/de/docs/managing-your-installation'], count: 1 },
  { path: ['/de', '/de/docs/self-hosting'], count: 1 },
  { path: ['/compare/plausible', '/compare/google-analytics', '/compare/posthog', '/compare/umami'], count: 1 },
  { path: ['/de', '/de/for-european-companies', '/de/docs/self-hosting', '/de/docs/managing-your-installation'], count: 1 },
]
const journeyValues = () => journeyBase.map((row, i) => ({ ...row, count: row.count * (i % 3 + 1) + i % 2 }))
const journeyRows = shallowRef(journeyBase)
const journeySteps = ref(4)
const addedJourney = { path: ['/lab/start', '/lab/browse', '/lab/compare', '/lab/finish'], count: 3 }

// Steps shared by most categorical scenarios.
const categorical = [
  ['values', () => { rows.value = mk(rows.value.map(r => r.name), alt) }],
  ['append2', () => { const n = rows.value.length; rows.value = [...rows.value, ...mk(months.slice(n, n + 2), (i, s) => base(i + n, s))] }],
  ['removeMiddle', () => { rows.value = rows.value.filter((_, i) => i !== 2 && i !== 3) }],
  ['shift', () => { const last = months.indexOf(rows.value.at(-1).name); rows.value = [...rows.value.slice(1), ...mk([months[last + 1]], (i, s) => base(last + 1, s))] }],
  ['hideA', () => { hidden.value = ['a'] }],
  ['showA', () => { hidden.value = [] }],
  ['toOne', () => { rows.value = rows.value.slice(0, 1) }],
  ['fromOne', () => { rows.value = mk(months.slice(0, 6), base) }],
  ['empty', () => { rows.value = [] }],
  ['refill', () => { rows.value = mk(months.slice(0, 6), alt) }],
]

const pieRows = computed(() => rows.value.map(r => ({ name: r.name, value: r.a })))
const funnelRows = computed(() => [...pieRows.value].sort((x, y) => y.value - x.value))
const treeRows = computed(() => rows.value.map(r => ({ name: r.name, size: r.a * 10 })))
const sankeyData = computed(() => ({
  nodes: [{ name: 'Total' }, ...rows.value.map(r => ({ name: r.name }))],
  links: rows.value.map((r, i) => ({ source: 0, target: i + 1, value: r.a })),
}))
const sunData = computed(() => ({
  name: 'root',
  children: rows.value.map(r => ({ name: r.name, children: [{ name: `${r.name}-x`, value: r.a }, { name: `${r.name}-y`, value: r.b }] })),
}))
const scatterRows = computed(() => rows.value.map((r, i) => ({ name: r.name, x: r.a, y: r.b, z: 50 + i * 40 })))

const nullGap = ['nullGap', () => { rows.value = rows.value.map((r, i) => i === 2 ? { ...r, a: null } : r) }]
const steps = {
  journey: [
    ['values', () => { journeyRows.value = journeyValues() }],
    ['top8', () => { journeyRows.value = [...journeyValues()].sort((a, b) => b.count - a.count).slice(0, 8) }],
    ['top15', () => { journeyRows.value = journeyValues() }],
    ['steps3', () => { journeySteps.value = 3 }],
    ['steps4', () => { journeySteps.value = 4 }],
    ['addJourney', () => { journeyRows.value = [...journeyRows.value.filter(row => row !== addedJourney), addedJourney] }],
    ['removeJourney', () => { journeyRows.value = journeyRows.value.filter(row => row !== addedJourney) }],
    ['empty', () => { journeyRows.value = [] }],
    ['refill', () => { journeyRows.value = journeyBase }],
  ],
  heatmap: [
    ['values', () => { heatRows.value = heatData(heatDays, 1) }],
    ['dropDay', () => { heatRows.value = heatRows.value.filter(row => row.y !== 'Wed') }],
    ['addDay', () => { heatRows.value = heatData(heatDays, 1) }],
    ['xOrder', () => { heatX.value = [...heatX.value].reverse() }],
    ['empty', () => { heatRows.value = [] }],
    ['refill', () => { heatRows.value = heatData() }],
  ],
  cohort: [
    ['values', () => { cohortRows.value = cohortData(0, 1) }],
    ['nextMonth', () => {
      cohortRows.value = [...cohortRows.value.slice(1).map(row => ({ ...row, values: [...row.values, Math.round(row.values.at(-1) * 0.85)] })), { cohort: 'Jul', values: [1622] }]
    }],
    ['count', () => { cohortMode.value = 'count' }],
    ['percent', () => { cohortMode.value = 'percent' }],
  ],
  sparkline: [
    ['shift', () => shiftSpark(1)],
    ['shift5', () => shiftSpark(5)],
    ['gap', () => { sparkRows.value = sparkRows.value.map((row, i) => i === 12 ? { ...row, value: null } : row) }],
    ['values', () => { sparkRows.value = sparkData(dayOf(sparkRows.value[0].date), sparkRows.value.length, 1) }],
    ['to10', () => { sparkRows.value = sparkRows.value.slice(-10) }],
    ['to30', () => { sparkRows.value = sparkData(dayOf(sparkRows.value.at(-1).date) - 29) }],
    ['empty', () => { sparkRows.value = [] }],
    ['refill', () => { sparkRows.value = sparkData(sparkStart) }],
  ],
  barList: [
    ['rerank', () => { listRows.value = listRows.value.map((row, i) => ({ ...row, value: 150 + i * 110 })).reverse() }],
    ['add', () => { listRows.value = [...listRows.value, { name: 'Jul', value: 480 }] }],
    ['remove', () => { listRows.value = listRows.value.filter(row => row.name !== 'Mar') }],
    ['values', () => { listRows.value = listRows.value.map(row => ({ ...row, value: row.value * 0.6 + 90 })) }],
    ['empty', () => { listRows.value = [] }],
    ['refill', () => { listRows.value = listData() }],
  ],
  tracker: [
    ['shift', () => shiftTracker(1)],
    ['shift3', () => shiftTracker(3)],
    ['status', () => { trackerRows.value = trackerRows.value.map((row, i) => i < 5 ? { ...row, status: statuses[(statuses.indexOf(row.status) + 1) % statuses.length] } : row) }],
    ['to14', () => { trackerRows.value = trackerRows.value.slice(-14) }],
    ['to30', () => { trackerRows.value = trackerData(dayOf(trackerRows.value.at(-1).date) - 29) }],
    ['empty', () => { trackerRows.value = [] }],
    ['refill', () => { trackerRows.value = trackerData(trackerStart) }],
  ],
  calendar: [
    ['values', () => { calendarRows.value = calendarData(1) }],
    ['nextWeek', () => shiftCalendar(7)],
    ['nextYear', () => {
      const nextYear = (day) => {
        const date = new Date(day * 86400000)
        date.setUTCFullYear(date.getUTCFullYear() + 1)
        return date.getTime() / 86400000
      }
      calendarStart.value = nextYear(calendarStart.value)
      calendarEnd.value = nextYear(calendarEnd.value)
      calendarRows.value = calendarData()
    }],
    ['weekStart', () => { weekStart.value = weekStart.value === 0 ? 1 : 0 }],
    ['narrow', () => { width.value = 360 }],
    ['wide', () => { width.value = 720 }],
    ['empty', () => { calendarRows.value = [] }],
    ['refill', () => { calendarRows.value = calendarData() }],
  ],
  bar: categorical,
  barStacked: categorical,
  barHorizontal: categorical,
  barNegative: [['negative', () => { rows.value = rows.value.map((r, i) => ({ ...r, a: i % 2 ? -r.a : r.a })) }], ['positive', () => { rows.value = rows.value.map(r => ({ ...r, a: Math.abs(r.a) })) }]],
  line: [...categorical, nullGap],
  lineMonotone: [...categorical, nullGap],
  area: [...categorical, nullGap],
  areaStacked: categorical,
  composed: categorical,
  scatter: categorical,
  pie: categorical,
  donut: categorical,
  radar: categorical,
  radial: categorical,
  funnel: categorical,
  treemap: categorical,
  sankey: categorical,
  sunburst: categorical,
  tooltip: [],
  barMany: heavySteps,
  brush: [],
  lineMany: heavySteps,
  resize: [['narrow', () => { width.value = 360 }], ['wide', () => { width.value = 720 }]],
}

window.lab = {
  scenario,
  steps: (steps[scenario] || []).map(([name]) => name),
  step: name => steps[scenario].find(([n]) => n === name)[1](),
}

const palette = { a: '#3879bf', b: '#79bb9e' }

// Stress: ?s=stress&type=line|bar|area|scatter&n=10000&series=1 — large data for profiling.
const query = new URLSearchParams(location.search)
const stressType = query.get('type') || 'line'
const stressN = Number(query.get('n') || 1000)
const stressSeries = Array.from({ length: Number(query.get('series') || 1) }, (_, j) => `s${j}`)
const stressRows = shallowRef(Array.from({ length: stressN }, (_, i) => ({ name: `N${i}`, x: i, ...Object.fromEntries(stressSeries.map((key, j) => [key, 20 + 15 * Math.sin(i / 40 + j) + (i * 7919) % 13])) })))
if (scenario === 'stress') {
  steps.stress = [['values', () => { stressRows.value = stressRows.value.map(row => ({ ...row, ...Object.fromEntries(stressSeries.map(key => [key, row[key] * 0.7 + 8])) })) }]]
  window.lab.steps = ['values']
}
</script>

<template>
  <main :class="{ dark }">
    <div
      class="frame"
      :style="{ width: `${width}px` }"
    >
      <template v-if="scenario === 'stress'">
        <LineChart
          v-if="stressType === 'line'"
          :is-animation-active="staticTarget ? false : undefined"
          :height="360"
          :data="stressRows"
        >
          <XAxis data-key="name" /><YAxis /><Tooltip :is-animation-active="staticTarget ? false : undefined" />
          <Line
            v-for="key in stressSeries"
            :key="key"
            :data-key="key"
            :dot="false"
            :stroke="palette.a"
          />
        </LineChart>
        <AreaChart
          v-else-if="stressType === 'area'"
          :is-animation-active="staticTarget ? false : undefined"
          :height="360"
          :data="stressRows"
        >
          <XAxis data-key="name" /><YAxis /><Tooltip :is-animation-active="staticTarget ? false : undefined" />
          <Area
            v-for="key in stressSeries"
            :key="key"
            :data-key="key"
            stack-id="s"
            :fill="palette.a"
            :stroke="palette.a"
          />
        </AreaChart>
        <BarChart
          v-else-if="stressType === 'bar'"
          :is-animation-active="staticTarget ? false : undefined"
          :height="360"
          :data="stressRows"
        >
          <XAxis data-key="name" /><YAxis /><Tooltip :is-animation-active="staticTarget ? false : undefined" />
          <Bar
            v-for="key in stressSeries"
            :key="key"
            :data-key="key"
            :fill="palette.a"
          />
        </BarChart>
        <ScatterChart
          v-else
          :is-animation-active="staticTarget ? false : undefined"
          :height="360"
        >
          <XAxis
            data-key="x"
            type="number"
          /><YAxis
            :data-key="stressSeries[0]"
            type="number"
          /><Tooltip :is-animation-active="staticTarget ? false : undefined" />
          <Scatter
            :data="stressRows"
            :fill="palette.a"
          />
        </ScatterChart>
      </template>
      <BarChart
        v-if="scenario === 'bar'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <CartesianGrid :vertical="false" /><XAxis data-key="name" /><YAxis /><Tooltip :is-animation-active="staticTarget ? false : undefined" /><Legend v-model:hidden="hidden" />
        <Bar
          data-key="a"
          :fill="palette.a"
          :radius="[4, 4, 0, 0]"
        >
          <LabelList position="top" />
        </Bar>
        <Bar
          data-key="b"
          :fill="palette.b"
          :radius="[4, 4, 0, 0]"
        />
      </BarChart>
      <Tracker
        v-else-if="scenario === 'tracker'"
        :is-animation-active="staticTarget ? false : undefined"
        :data="trackerRows"
        name-key="date"
        :width="720"
        :height="36"
      />
      <CalendarHeatmap
        v-else-if="scenario === 'calendar'"
        :is-animation-active="staticTarget ? false : undefined"
        :data="calendarRows"
        :start="isoDay(calendarStart)"
        :end="isoDay(calendarEnd)"
        :week-start="weekStart"
      />
      <Heatmap
        v-else-if="scenario === 'heatmap'"
        :is-animation-active="staticTarget ? false : undefined"
        :data="heatRows"
        :x-domain="heatX"
        :height="240"
      />
      <CohortChart
        v-else-if="scenario === 'cohort'"
        :is-animation-active="staticTarget ? false : undefined"
        :data="cohortRows"
        :mode="cohortMode"
        :height="240"
      />
      <div
        v-else-if="scenario === 'sparkline'"
        style="display: flex; gap: 12px; padding: 12px"
      >
        <Sparkline
          v-for="type in ['line', 'area', 'bar']"
          :key="type"
          :is-animation-active="staticTarget ? false : undefined"
          :type="type"
          :data="sparkRows"
          name-key="date"
          :width="224"
          :height="80"
        />
      </div>
      <div
        v-else-if="scenario === 'barList'"
        style="height: 252px"
      >
        <BarList
          :is-animation-active="staticTarget ? false : undefined"
          :data="listRows"
        />
      </div>
      <BarChart
        v-else-if="scenario === 'barStacked'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <CartesianGrid /><XAxis data-key="name" /><YAxis /><Legend v-model:hidden="hidden" />
        <Bar
          data-key="a"
          stack-id="s"
          :fill="palette.a"
        />
        <Bar
          data-key="b"
          stack-id="s"
          :fill="palette.b"
          :radius="[4, 4, 0, 0]"
        />
      </BarChart>
      <BarChart
        v-else-if="scenario === 'barHorizontal'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
        layout="vertical"
      >
        <XAxis type="number" /><YAxis
          type="category"
          data-key="name"
        /><Legend v-model:hidden="hidden" />
        <Bar
          data-key="a"
          :fill="palette.a"
        /><Bar
          data-key="b"
          :fill="palette.b"
        />
      </BarChart>
      <BarChart
        v-else-if="scenario === 'barNegative'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <XAxis data-key="name" /><YAxis /><Bar
          data-key="a"
          :fill="palette.a"
        />
      </BarChart>
      <LineChart
        v-else-if="scenario === 'line' || scenario === 'lineMonotone'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <CartesianGrid /><XAxis data-key="name" /><YAxis /><Tooltip :is-animation-active="staticTarget ? false : undefined" /><Legend v-model:hidden="hidden" />
        <Line
          data-key="a"
          :type="scenario === 'line' ? 'linear' : 'monotone'"
          :stroke="palette.a"
          :stroke-width="2"
          label
        />
        <Line
          data-key="b"
          :type="scenario === 'line' ? 'linear' : 'monotone'"
          :stroke="palette.b"
          :stroke-width="2"
        />
      </LineChart>
      <AreaChart
        v-else-if="scenario === 'area'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <CartesianGrid /><XAxis data-key="name" /><YAxis /><Tooltip :is-animation-active="staticTarget ? false : undefined" /><Legend v-model:hidden="hidden" />
        <Area
          data-key="a"
          type="monotone"
          :fill="palette.a"
          :stroke="palette.a"
          :fill-opacity="0.3"
          dot
          label
        />
        <Area
          data-key="b"
          type="monotone"
          :fill="palette.b"
          :stroke="palette.b"
          :fill-opacity="0.3"
        />
      </AreaChart>
      <AreaChart
        v-else-if="scenario === 'areaStacked'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <CartesianGrid /><XAxis data-key="name" /><YAxis /><Legend v-model:hidden="hidden" />
        <Area
          data-key="a"
          stack-id="s"
          type="natural"
          :fill="palette.a"
          :stroke="palette.a"
          :fill-opacity="0.4"
        />
        <Area
          data-key="b"
          stack-id="s"
          type="natural"
          :fill="palette.b"
          :stroke="palette.b"
          :fill-opacity="0.4"
        />
      </AreaChart>
      <ComposedChart
        v-else-if="scenario === 'composed'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <CartesianGrid /><XAxis data-key="name" /><YAxis /><Legend v-model:hidden="hidden" /><Tooltip :is-animation-active="staticTarget ? false : undefined" />
        <Area
          data-key="b"
          type="monotone"
          :fill="palette.b"
          :stroke="palette.b"
          :fill-opacity="0.3"
        />
        <Bar
          data-key="a"
          :fill="palette.a"
          :bar-size="20"
        />
        <Line
          data-key="a"
          type="monotone"
          stroke="#e8a33b"
          :stroke-width="2"
        />
      </ComposedChart>
      <ScatterChart
        v-else-if="scenario === 'scatter'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
      >
        <CartesianGrid /><XAxis
          data-key="x"
          type="number"
        /><YAxis
          data-key="y"
          type="number"
        /><ZAxis
          data-key="z"
          :range="[40, 300]"
        />
        <Scatter
          :data="scatterRows"
          label
          :fill="palette.a"
        />
      </ScatterChart>
      <PieChart
        v-else-if="scenario === 'pie' || scenario === 'donut'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
      >
        <Legend v-model:hidden="hidden" /><Tooltip :is-animation-active="staticTarget ? false : undefined" />
        <Pie
          :data="pieRows"
          data-key="value"
          name-key="name"
          :inner-radius="scenario === 'donut' ? 70 : 0"
          :outer-radius="120"
          :fill="palette.a"
          label
          :padding-angle="scenario === 'donut' ? 2 : 0"
        />
      </PieChart>
      <RadarChart
        v-else-if="scenario === 'radar'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <PolarGrid /><PolarAngleAxis data-key="name" /><PolarRadiusAxis />
        <Radar
          data-key="a"
          label
          :fill="palette.a"
          :fill-opacity="0.4"
          :stroke="palette.a"
          dot
        />
        <Radar
          data-key="b"
          :fill="palette.b"
          :fill-opacity="0.4"
          :stroke="palette.b"
        />
      </RadarChart>
      <RadialBarChart
        v-else-if="scenario === 'radial'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
        :inner-radius="30"
        :outer-radius="160"
      >
        <RadialBar
          data-key="a"
          :fill="palette.a"
          label
          background
        />
        <Legend />
      </RadialBarChart>
      <FunnelChart
        v-else-if="scenario === 'funnel'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
      >
        <Tooltip :is-animation-active="staticTarget ? false : undefined" /><Funnel
          :data="funnelRows"
          data-key="value"
          name-key="name"
          :fill="palette.a"
        >
          <LabelList
            position="right"
            data-key="name"
          />
        </Funnel>
      </FunnelChart>
      <Treemap
        v-else-if="scenario === 'treemap'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="treeRows"
        data-key="size"
        :fill="palette.a"
        stroke="#fff"
      />
      <JourneySankey
        v-else-if="scenario === 'journey'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="480"
        :data="journeyRows"
        :steps="journeySteps"
      />
      <Sankey
        v-else-if="scenario === 'sankey'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="sankeyData"
      />
      <SunburstChart
        v-else-if="scenario === 'sunburst'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="sunData"
      />
      <LineChart
        v-else-if="scenario === 'tooltip'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <CartesianGrid /><XAxis data-key="name" /><YAxis /><Tooltip :is-animation-active="staticTarget ? false : undefined" />
        <Line
          data-key="a"
          type="monotone"
          :stroke="palette.a"
        /><Line
          data-key="b"
          type="monotone"
          :stroke="palette.b"
        />
      </LineChart>
      <BarChart
        v-else-if="scenario === 'brush'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <CartesianGrid :vertical="false" /><XAxis data-key="name" /><YAxis /><Tooltip :is-animation-active="staticTarget ? false : undefined" />
        <Bar
          data-key="a"
          :fill="palette.a"
        /><Brush
          data-key="name"
          :height="30"
          :start-index="10"
          :end-index="30"
        />
      </BarChart>
      <BarChart
        v-else-if="scenario === 'barMany'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <CartesianGrid :vertical="false" /><XAxis data-key="name" /><YAxis /><Tooltip :is-animation-active="staticTarget ? false : undefined" /><Legend v-model:hidden="hidden" />
        <Bar
          data-key="a"
          :fill="palette.a"
        /><Bar
          data-key="b"
          :fill="palette.b"
        />
      </BarChart>
      <LineChart
        v-else-if="scenario === 'lineMany'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <CartesianGrid /><XAxis data-key="name" /><YAxis /><Tooltip :is-animation-active="staticTarget ? false : undefined" /><Legend v-model:hidden="hidden" />
        <Line
          data-key="a"
          type="monotone"
          :stroke="palette.a"
          :dot="false"
        /><Line
          data-key="b"
          type="monotone"
          :stroke="palette.b"
          :dot="false"
        />
      </LineChart>
      <BarChart
        v-else-if="scenario === 'resize'"
        :is-animation-active="staticTarget ? false : undefined"
        :height="360"
        :data="rows"
      >
        <XAxis data-key="name" /><YAxis /><Bar
          data-key="a"
          :fill="palette.a"
        />
      </BarChart>
    </div>
  </main>
</template>

<style>
body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; background: #fff; }
.dark body, html.dark body { background: #0b0b0c; color: #eee; }
.frame { border: 1px dashed #ddd; }
</style>
