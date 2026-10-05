<script setup lang="ts">
import { BarList, CalendarHeatmap, CohortChart, Heatmap, JourneySankey, Sparkline, Tracker } from 'vccs'
import { Button } from '@/components/ui/button'
import ChartMotionCard from '@/components/motion/ChartMotionCard.vue'
import EntranceRow, { type EntranceOption } from '@/components/motion/EntranceRow.vue'
import TreemapEntranceCard from '@/components/motion/TreemapEntranceCard.vue'
import { treemapEntrances } from '@/components/motion/treemapEntrances'
import { useSlowMotion } from '@/components/motion/useSlowMotion'

const slow = useSlowMotion()
const replayAll = ref(0)

type CellEntrance = 'grow' | 'fade' | 'cascade' | 'wave' | 'sweep' | 'rows' | 'rise' | 'ripple' | 'values' | 'slide'
type JourneyEntrance = 'grow' | 'flow' | 'columns' | 'diagonal' | 'pages' | 'fade'
const cell = (id: CellEntrance, name: string, description: string, current = false): EntranceOption<CellEntrance> => ({ id, name, description, current })
const trackerEntrances = [
  cell('grow', 'Grow', 'Every bar grows from its bottom edge at once.', true),
  cell('sweep', 'Sweep', 'Day by day from the left, each bar fading in as it settles.'),
  cell('rise', 'Rise', 'Day by day from the left, each bar rising from its bottom edge.'),
  cell('ripple', 'Ripple', 'From the middle outwards, bars fading in as they settle.'),
  cell('slide', 'Slide in', 'The whole strip fades in while sliding 12 px from the left.'),
  cell('fade', 'Fade', 'Every bar fades in place, all at once.'),
]
const heatmapEntrances = [
  cell('grow', 'Grow', 'Every cell grows from its center at once.', true),
  cell('cascade', 'Diagonal cascade', 'A wave from the top-left corner, like the treemap.'),
  cell('wave', 'Diagonal fade', 'Only fading, no size change, in a wave from the top-left corner.'),
  cell('sweep', 'Sweep', 'Hour by hour from the left.'),
  cell('rows', 'Rows', 'Day by day from the top, each row settling down into place.'),
  cell('values', 'Hot spots first', 'The highest values appear first, then the quiet hours.'),
  cell('ripple', 'Ripple', 'From the middle outwards.'),
]
const cohortEntrances = [
  cell('grow', 'Grow', 'Every cell grows from its center at once.', true),
  cell('cascade', 'Diagonal cascade', 'A wave from the top-left corner, like the treemap.'),
  cell('wave', 'Diagonal fade', 'Only fading, no size change, in a wave from the top-left corner.'),
  cell('slide', 'Cohorts slide in', 'Cohort by cohort from the top, each row sliding in from the left.'),
  cell('sweep', 'Period by period', 'Column by column, the way retention decays.'),
  cell('values', 'Strongest first', 'The highest retention appears first.'),
  cell('fade', 'Fade', 'Every cell fades in place, all at once.'),
]
const calendarEntrances = [
  cell('grow', 'Grow', 'Every day grows from its center at once.', true),
  cell('sweep', 'Through the year', 'Week by week from January, like time running.'),
  cell('cascade', 'Diagonal cascade', 'A wave from the top-left corner, like the treemap.'),
  cell('wave', 'Diagonal fade', 'Only fading, no size change, in a wave from the top-left corner.'),
  cell('rows', 'Weekdays', 'Weekday by weekday from the top, each row settling into place.'),
  cell('values', 'Busiest first', 'The busiest days appear first.'),
  cell('ripple', 'Ripple', 'From the middle of the year outwards.'),
]
const journeyEntrances: EntranceOption<JourneyEntrance>[] = [
  { id: 'grow', name: 'Grow', description: 'Pages and bands grow at once and fade in late.', current: true },
  { id: 'flow', name: 'Flow', description: 'Step by step from the left, each band stretching out from its source page.' },
  { id: 'columns', name: 'Columns', description: 'Column by column, pages settling in, bands arriving with their target.' },
  { id: 'diagonal', name: 'Diagonal cascade', description: 'A wave from the top-left corner, like the treemap.' },
  { id: 'pages', name: 'Pages, then paths', description: 'The pages appear column by column, then the paths between them.' },
  { id: 'fade', name: 'Fade', description: 'Everything fades in together.' },
]

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
// Fixed data for the entrance candidates, so a parent re-render never hands them a new array.
const samples = { tracker: trackerDays(trackerStart), heat: heatCells(), cohort: cohortRows(), calendar: calendarDays() }
const extraJourney = { path: ['/blog', '/blog/launch', '/pricing', '/signup'], count: 3 }
</script>

<template>
  <div class="container space-y-12 py-10 [--v-charts-text:var(--muted-foreground)] [--v-charts-inactive:var(--muted-foreground)] [--v-charts-background:var(--background)] [--v-charts-tooltip-background:var(--popover)] [--v-charts-tooltip-foreground:var(--popover-foreground)] [--v-charts-tooltip-border:var(--border)]">
    <div class="max-w-2xl">
      <h1 class="text-2xl font-bold tracking-tight">
        Motion
      </h1>
      <p class="mt-1 text-sm text-muted-foreground text-pretty">
        Every entrance plays once half the chart is on screen. Use slow motion to compare the shapes of the movement, not only the result.
      </p>
    </div>

    <section class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="max-w-2xl">
          <h2 class="text-lg font-semibold">
            Treemap entrance styles
          </h2>
          <p class="mt-1 text-sm text-muted-foreground text-pretty">
            Diagonal cascade is chosen and is now the library's Treemap entrance. The others stay here for comparison.
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
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TreemapEntranceCard
          v-for="entrance in treemapEntrances"
          :key="entrance.id"
          :entrance="entrance"
          :replay-all="replayAll"
        />
      </div>
    </section>

    <section class="space-y-10">
      <div class="max-w-2xl">
        <h2 class="text-lg font-semibold">
          Entrance candidates
        </h2>
        <p class="mt-1 text-sm text-muted-foreground text-pretty">
          The library's real animations, one candidate per card next to today's entrance. Each plays when it scrolls into view; slow motion and "Replay all" above apply here too.
        </p>
      </div>

      <EntranceRow
        v-slot="{ entrance }"
        title="Tracker"
        description="30 days of status."
        :options="trackerEntrances"
        :replay-all="replayAll"
      >
        <Tracker
          :data="samples.tracker"
          name-key="date"
          :height="36"
          :entrance="entrance"
        />
      </EntranceRow>

      <EntranceRow
        v-slot="{ entrance }"
        title="Heatmap"
        description="Visits per weekday and hour."
        :options="heatmapEntrances"
        :replay-all="replayAll"
      >
        <Heatmap
          :data="samples.heat"
          :height="200"
          :entrance="entrance"
        />
      </EntranceRow>

      <EntranceRow
        v-slot="{ entrance }"
        title="Cohort retention"
        description="Six monthly cohorts."
        :options="cohortEntrances"
        :replay-all="replayAll"
      >
        <CohortChart
          :data="samples.cohort"
          :height="220"
          :entrance="entrance"
        />
      </EntranceRow>

      <EntranceRow
        v-slot="{ entrance }"
        title="Calendar heatmap"
        description="A year of daily activity."
        :options="calendarEntrances"
        :replay-all="replayAll"
        columns="lg:grid-cols-2"
      >
        <div class="overflow-x-auto">
          <CalendarHeatmap
            class="min-w-[560px]"
            :data="samples.calendar"
            :start="`${year}-01-01`"
            :end="`${year}-12-31`"
            :week-start="1"
            color="var(--chart-2)"
            :entrance="entrance"
          />
        </div>
      </EntranceRow>

      <EntranceRow
        v-slot="{ entrance }"
        title="Journeys"
        description="Paths from session start over four steps."
        :options="journeyEntrances"
        :replay-all="replayAll"
        columns="lg:grid-cols-2"
      >
        <div class="overflow-x-auto">
          <JourneySankey
            class="min-w-[640px]"
            :data="journeysBase"
            :steps="4"
            :height="380"
            :entrance="entrance"
          />
        </div>
      </EntranceRow>
    </section>

    <section class="space-y-4">
      <div class="max-w-2xl">
        <h2 class="text-lg font-semibold">
          New chart transitions
        </h2>
        <p class="mt-1 text-sm text-muted-foreground text-pretty">
          The library's real animations. Each button changes the data the way a dashboard would; "Entrance" replays the first draw.
        </p>
      </div>
      <div class="grid gap-4 lg:grid-cols-2">
        <ChartMotionCard
          title="Tracker"
          description="A new day slides the whole window like a conveyor belt; changed statuses recolor in place."
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
          title="Heatmap"
          description="Cells recolor; a removed row closes the gap and the others slide together."
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
          title="Cohort retention"
          description="A new month shifts every cohort up a row; counts and percentages swap in place."
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
          class="lg:col-span-2"
          title="Calendar heatmap"
          description="Values recolor; a new first weekday folds each day away and unfolds it in its new row."
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
          class="lg:col-span-2"
          title="Journeys"
          description="Bands and pages resize in place. A page that changes rank folds away and reappears at its new place; added steps and journeys fade in."
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
      </div>
    </section>
  </div>
</template>
