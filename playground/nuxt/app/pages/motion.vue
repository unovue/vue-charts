<script setup lang="ts">
import { BarList, CalendarHeatmap, CohortChart, Heatmap, JourneySankey, Sparkline, Tracker, Treemap } from 'vccs'
import { Button } from '@/components/ui/button'
import ChartMotionCard from '@/components/motion/ChartMotionCard.vue'
import { treemapColors, treemapData } from '@/components/motion/treemapData'
import { useSlowMotion } from '@/components/motion/useSlowMotion'

const slow = useSlowMotion()
const replayAll = ref(0)

// Data and changes follow the motion lab (packages/vue/test/lab), so what you see here is what
// the motion checks measure. UTC arithmetic keeps the days independent of the time zone.
const isoDay = (day: number) => new Date(day * 86400000).toISOString().slice(0, 10)
const dayOf = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86400000

const statuses = ['up', 'up', 'up', 'degraded', 'up', 'down', 'up', 'maintenance']
const trackerStart = dayOf('2026-09-01')
const trackerDays = (start: number, count = 30) => Array.from({ length: count }, (_, i) => ({ date: isoDay(start + i), status: statuses[(start + i) % statuses.length]! }))
const tracker = shallowRef(trackerDays(trackerStart))
function shiftTracker(count: number) {
  const next = dayOf(tracker.value.at(-1)!.date) + 1
  tracker.value = [...tracker.value.slice(count), ...trackerDays(next, count)]
}

const year = ref(2026)
const weekStart = ref<0 | 1>(1)
function calendarDays(variant = 0) {
  const start = dayOf(`${year.value}-01-01`)
  const end = dayOf(`${year.value}-12-31`)
  return Array.from({ length: end - start + 1 }, (_, i) => ({ date: isoDay(start + i), value: ((i * 17 + variant * 23) % 101) * ((i + variant) % 5 ? 1 : 0) }))
}
const calendar = shallowRef(calendarDays())

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hours = Array.from({ length: 24 }, (_, i) => i)
const heatHours = shallowRef(hours)
const heatCells = (days = weekdays, variant = 0) => days.flatMap((y, i) => hours.map(x => ({ x, y, value: (x * 13 + i * 19 + variant * 31) % 101 })))
const heat = shallowRef(heatCells())

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
const cohortMode = ref<'percent' | 'count'>('percent')
function cohortRows(variant = 0) {
  return Array.from({ length: 6 }, (_, i) => {
    const size = 800 + i * 137
    return { cohort: months[i]!, values: Array.from({ length: 6 - i }, (_, period) => Math.round(size * (period ? Math.max(0.1, 0.8 - period * 0.09 + variant * 0.04) : 1))) }
  })
}
const cohort = shallowRef(cohortRows())

const sparkDays = (start: number, count = 30, variant = 0) => Array.from({ length: count }, (_, i) => ({ date: isoDay(start + i), value: Math.round(50 + 25 * Math.sin((start + i) * 0.7 + variant) + variant * 10) }))
const spark = shallowRef(sparkDays(trackerStart))
function shiftSpark(count: number) {
  const next = dayOf(spark.value.at(-1)!.date) + 1
  spark.value = [...spark.value.slice(count), ...sparkDays(next, count)]
}

const pagesBase = [
  { name: '/', value: 1840 },
  { name: '/pricing', value: 1220 },
  { name: '/docs', value: 960 },
  { name: '/blog/launch', value: 610 },
  { name: '/features', value: 420 },
]
const pages = shallowRef(pagesBase)

const journeysBase = [
  { path: ['/', '/pricing'], count: 6 },
  { path: ['/', '/pricing', '/', '/docs'], count: 1 },
  { path: ['/', '/pricing', '/docs/self-hosting'], count: 1 },
  { path: ['/', '/pricing', '/features/session-replay', '/features/web-analytics'], count: 1 },
  { path: ['/', '/docs'], count: 2 },
  { path: ['/', '/docs', '/pricing', '/features/session-replay'], count: 1 },
  { path: ['/de', '/de/pricing', '/de', '/de/compare/fathom'], count: 1 },
  { path: ['/de', '/de/pricing', '/de'], count: 1 },
  { path: ['/de', '/features/web-analytics', '/de/docs/self-hosting'], count: 1 },
  { path: ['/de', '/de/docs/self-hosting'], count: 1 },
  { path: ['/compare/plausible', '/compare/google-analytics', '/compare/posthog'], count: 1 },
]
const journeyValues = () => journeysBase.map((row, i) => ({ ...row, count: row.count * (i % 3 + 1) + i % 2 }))
const journeys = shallowRef(journeysBase)
const journeySteps = ref(4)
const treemapValues = () => treemapData.map(group => ({ ...group, children: group.children.map((leaf, i) => ({ ...leaf, value: leaf.value * (i % 3 + 1) })) }))
const treemap = shallowRef(treemapData)
const extraJourney = { path: ['/blog', '/blog/launch', '/pricing', '/signup'], count: 3 }
</script>

<template>
  <div class="container space-y-12 py-10 [--v-charts-text:var(--muted-foreground)] [--v-charts-inactive:var(--muted-foreground)] [--v-charts-background:var(--background)] [--v-charts-tooltip-background:var(--popover)] [--v-charts-tooltip-foreground:var(--popover-foreground)] [--v-charts-tooltip-border:var(--border)]">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div class="max-w-2xl">
        <h1 class="text-2xl font-bold tracking-tight">
          Motion
        </h1>
        <p class="mt-1 text-sm text-muted-foreground text-pretty">
          The library's real animations. Each entrance plays once half the chart is on screen; each button changes the data the way a dashboard would. Use slow motion to judge the movement, not only the result.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          size="sm"
          :variant="slow === 4 ? 'default' : 'outline'"
          :aria-pressed="slow === 4"
          @click="slow = slow === 4 ? 1 : 4"
        >
          Slow motion ×4
        </Button>
        <Button
          size="sm"
          variant="outline"
          @click="replayAll++"
        >
          Replay all
        </Button>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <ChartMotionCard
        :replay-all="replayAll"
        title="Tracker"
        description="Enters day by day, each bar sliding in from the left. A new day slides the whole window like a conveyor belt; changed statuses recolor in place."
        :steps="[
          { label: 'Next day', run: () => shiftTracker(1) },
          { label: 'Next 3 days', run: () => shiftTracker(3) },
          { label: 'Change statuses', run: () => { tracker = tracker.map((row, i) => i > 24 ? { ...row, status: row.status === 'up' ? 'down' : 'up' } : row) } },
          { label: '14 days', run: () => { tracker = tracker.slice(-14) } },
          { label: '30 days', run: () => { tracker = trackerDays(dayOf(tracker.at(-1)!.date) - 29) } },
        ]"
      >
        <Tracker
          :data="tracker"
          name-key="date"
          :height="36"
        />
      </ChartMotionCard>

      <ChartMotionCard
        :replay-all="replayAll"
        title="Bar list"
        description="Rows slide to their new rank while bars resize; new rows grow in, removed rows fade out."
        :steps="[
          { label: 'Re-rank', run: () => { pages = pages.map((row, i) => ({ ...row, value: 300 + i * 380 })) } },
          { label: 'Add row', run: () => { pages = [...pages.filter(row => row.name !== '/signup'), { name: '/signup', value: 700 }] } },
          { label: 'Remove /docs', run: () => { pages = pages.filter(row => row.name !== '/docs') } },
          { label: 'Reset', run: () => { pages = pagesBase } },
        ]"
      >
        <BarList
          :data="pages"
          class="text-sm"
        />
      </ChartMotionCard>

      <ChartMotionCard
        :replay-all="replayAll"
        title="Heatmap"
        description="Enters as a diagonal cascade from the top-left corner. Cells recolor; a removed row closes the gap and the others slide together."
        :steps="[
          { label: 'New values', run: () => { heat = heatCells(weekdays, 1) } },
          { label: 'Drop Wednesday', run: () => { heat = heat.filter(row => row.y !== 'Wed') } },
          { label: 'All days', run: () => { heat = heatCells(weekdays, 1) } },
          { label: 'Reverse hours', run: () => { heatHours = [...heatHours].reverse() } },
        ]"
      >
        <Heatmap
          :data="heat"
          :x-domain="heatHours"
          :height="220"
        />
      </ChartMotionCard>

      <ChartMotionCard
        :replay-all="replayAll"
        title="Cohort retention"
        description="Enters as a diagonal cascade from the top-left corner. A new month shifts every cohort up a row; counts and percentages swap in place."
        :steps="[
          { label: 'New values', run: () => { cohort = cohortRows(1) } },
          { label: 'Next month', run: () => { cohort = [...cohort.slice(1).map(row => ({ ...row, values: [...row.values, Math.round(row.values.at(-1)! * 0.85)] })), { cohort: 'Jul', values: [1622] }] } },
          { label: cohortMode === 'percent' ? 'Show counts' : 'Show percent', run: () => { cohortMode = cohortMode === 'percent' ? 'count' : 'percent' } },
        ]"
      >
        <CohortChart
          :data="cohort"
          :mode="cohortMode"
          :height="220"
        />
      </ChartMotionCard>

      <ChartMotionCard
        :replay-all="replayAll"
        class="lg:col-span-2"
        title="Calendar heatmap"
        description="Enters as a diagonal cascade from the top-left corner. Values recolor; a new first weekday folds each day away and unfolds it in its new row."
        :steps="[
          { label: 'New values', run: () => { calendar = calendarDays(1) } },
          { label: weekStart === 1 ? 'Week starts Sunday' : 'Week starts Monday', run: () => { weekStart = weekStart === 1 ? 0 : 1 } },
          { label: 'Next year', run: () => { year++; calendar = calendarDays() } },
          { label: 'Previous year', run: () => { year--; calendar = calendarDays() } },
        ]"
      >
        <div class="overflow-x-auto">
          <CalendarHeatmap
            class="min-w-[640px]"
            :data="calendar"
            :start="`${year}-01-01`"
            :end="`${year}-12-31`"
            :week-start="weekStart"
            color="var(--chart-2)"
          />
        </div>
      </ChartMotionCard>

      <ChartMotionCard
        :replay-all="replayAll"
        class="lg:col-span-2"
        title="Sparklines"
        description="Lines draw from the left at a steady pace; new days slide in from the right."
        :steps="[
          { label: 'Next day', run: () => shiftSpark(1) },
          { label: 'Next 5 days', run: () => shiftSpark(5) },
          { label: 'New values', run: () => { spark = sparkDays(dayOf(spark[0]!.date), spark.length, 1) } },
          { label: 'Gap', run: () => { spark = spark.map((row, i) => i === 12 ? { ...row, value: null as unknown as number } : row) } },
          { label: '10 days', run: () => { spark = spark.slice(-10) } },
        ]"
      >
        <div class="grid grid-cols-3 gap-4">
          <Sparkline
            v-for="type in (['line', 'area', 'bar'] as const)"
            :key="type"
            :type="type"
            :data="spark"
            name-key="date"
            color="var(--chart-1)"
            :height="56"
          />
        </div>
      </ChartMotionCard>

      <ChartMotionCard
        :replay-all="replayAll"
        class="lg:col-span-2"
        title="Journeys"
        description="Enters as a diagonal cascade from the top-left corner. Bands and pages resize in place. A page that changes rank folds away and reappears at its new place; added steps and journeys fade in."
        :steps="[
          { label: 'New counts', run: () => { journeys = journeyValues() } },
          { label: 'Top 6', run: () => { journeys = [...journeyValues()].sort((a, b) => b.count - a.count).slice(0, 6) } },
          { label: 'All journeys', run: () => { journeys = journeyValues() } },
          { label: journeySteps === 4 ? '3 steps' : '4 steps', run: () => { journeySteps = journeySteps === 4 ? 3 : 4 } },
          { label: 'Add journey', run: () => { journeys = [...journeys.filter(row => row !== extraJourney), extraJourney] } },
          { label: 'Remove journey', run: () => { journeys = journeys.filter(row => row !== extraJourney) } },
        ]"
      >
        <div class="overflow-x-auto">
          <JourneySankey
            class="min-w-[720px]"
            :data="journeys"
            :steps="journeySteps"
            :height="420"
          />
        </div>
      </ChartMotionCard>

      <ChartMotionCard
        :replay-all="replayAll"
        class="lg:col-span-2"
        title="Treemap"
        description="A diagonal cascade from the top-left corner; new values resize the tiles in place."
        :steps="[
          { label: 'New values', run: () => { treemap = treemapValues() } },
          { label: 'Reset', run: () => { treemap = treemapData } },
        ]"
      >
        <Treemap
          :data="treemap"
          data-key="value"
          :color-panel="treemapColors"
          :aspect="3"
          stroke="var(--background)"
        />
      </ChartMotionCard>
    </div>
  </div>
</template>
