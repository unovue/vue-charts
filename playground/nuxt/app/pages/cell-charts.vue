<script setup lang="ts">
import { CalendarHeatmap, CohortChart, Heatmap, Tooltip, Tracker } from 'vccs'
import { Button } from '@/components/ui/button'

const statuses = ['up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'up', 'degraded', 'down', 'maintenance'] as const

let seed = 7
function random() {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

function isoDay(base: Date, offset: number) {
  const day = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + offset))
  return day.toISOString().slice(0, 10)
}

const end = new Date(Date.UTC(2026, 9, 4))
const days = ref(Array.from({ length: 90 }, (_, i) => ({
  date: isoDay(end, i - 89),
  status: i < 4 ? undefined : statuses[Math.floor(random() * statuses.length)],
})))

function nextDay() {
  const last = new Date(`${days.value.at(-1)!.date}T00:00:00Z`)
  days.value = [...days.value.slice(1), { date: isoDay(last, 1), status: statuses[Math.floor(random() * statuses.length)] }]
}

function breakToday() {
  const copy = [...days.value]
  copy[copy.length - 1] = { ...copy.at(-1)!, status: 'down' }
  days.value = copy
}

const shortRange = ref(false)
const shownDays = computed(() => shortRange.value ? days.value.slice(-30) : days.value)
const uptime = computed(() => {
  const known = shownDays.value.filter(day => day.status)
  return (known.filter(day => day.status !== 'down').length / Math.max(known.length, 1) * 100).toFixed(2)
})

function contributions(year: number) {
  const rows = []
  for (let day = 0; day < 366; day++) {
    const date = new Date(Date.UTC(year, 0, 1 + day))
    if (date.getUTCFullYear() !== year)
      break
    const weekday = date.getUTCDay()
    const busy = weekday === 0 || weekday === 6 ? 0.25 : 0.8
    const x = random()
    rows.push({ date: date.toISOString().slice(0, 10), count: x > busy ? 0 : Math.round(x * x * 14) })
  }
  return rows
}

const year = ref(2025)
const commits = ref(contributions(year.value))
const weekStart = ref<0 | 1>(0)
const total = computed(() => commits.value.reduce((sum, row) => sum + row.count, 0))

function showYear(next: number) {
  year.value = next
  commits.value = contributions(next)
}

function reshuffle() {
  commits.value = contributions(year.value)
}

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
function traffic() {
  return weekdays.flatMap((day, d) => Array.from({ length: 24 }, (_, hour) => ({
    day,
    hour,
    visits: Math.round((Math.sin((hour - 7) / 24 * Math.PI * 2) + 1.1) * (d < 5 ? 60 : 25) * (0.7 + random() * 0.6)),
  })))
}
const visits = ref(traffic())

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
function cohorts() {
  return months.map((cohort, i) => {
    const size = 800 + Math.round(random() * 600)
    return { cohort, values: Array.from({ length: months.length - i }, (_, period) => Math.round(size * (period ? (0.55 + random() * 0.1) * 0.85 ** period : 1))) }
  })
}
const retention = ref(cohorts())
const cohortMode = ref<'percent' | 'count'>('percent')
</script>

<template>
  <div class="container py-10 space-y-12 [--v-charts-muted:var(--muted)] [--v-charts-text:var(--muted-foreground)] [--v-charts-axis:var(--foreground)] [--v-charts-tooltip-background:var(--popover)] [--v-charts-tooltip-foreground:var(--popover-foreground)] [--v-charts-tooltip-border:var(--border)]">
    <div class="max-w-lg">
      <h1 class="text-2xl font-bold tracking-tight">
        Cell charts
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Uptime tracker and contribution calendar, built on one shared cell grid.
      </p>
    </div>

    <section class="rounded-xl border p-6 space-y-4">
      <div class="flex items-baseline justify-between">
        <div>
          <h2 class="font-medium">
            api.example.com
          </h2>
          <p class="text-sm text-muted-foreground">
            Last {{ shownDays.length }} days
          </p>
        </div>
        <span class="text-sm tabular-nums">{{ uptime }}% uptime</span>
      </div>
      <Tracker
        :data="shownDays"
        :height="36"
      >
        <Tooltip :cursor="false" />
      </Tracker>
      <div class="flex justify-between text-xs text-muted-foreground">
        <span>{{ shownDays[0]?.date }}</span><span>Today</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          @click="nextDay"
        >
          Next day
        </Button>
        <Button
          size="sm"
          variant="outline"
          @click="breakToday"
        >
          Today goes down
        </Button>
        <Button
          size="sm"
          variant="outline"
          @click="shortRange = !shortRange"
        >
          {{ shortRange ? 'Show 90 days' : 'Show 30 days' }}
        </Button>
      </div>
    </section>

    <section class="rounded-xl border p-6 space-y-4">
      <div class="flex items-baseline justify-between">
        <h2 class="font-medium">
          {{ total }} contributions in {{ year }}
        </h2>
      </div>
      <CalendarHeatmap
        :data="commits"
        data-key="count"
        :start="`${year}-01-01`"
        :end="`${year}-12-31`"
        :week-start="weekStart"
        color="var(--chart-2)"
      >
        <Tooltip :cursor="false" />
      </CalendarHeatmap>
      <div class="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          @click="showYear(year - 1)"
        >
          Previous year
        </Button>
        <Button
          size="sm"
          variant="outline"
          @click="showYear(year + 1)"
        >
          Next year
        </Button>
        <Button
          size="sm"
          variant="outline"
          @click="reshuffle"
        >
          New values
        </Button>
        <Button
          size="sm"
          variant="outline"
          @click="weekStart = weekStart ? 0 : 1"
        >
          Week starts {{ weekStart ? 'Monday' : 'Sunday' }}
        </Button>
      </div>
    </section>

    <section class="rounded-xl border p-6 space-y-4">
      <h2 class="font-medium">
        Visits by weekday and hour
      </h2>
      <Heatmap
        :data="visits"
        x-key="hour"
        y-key="day"
        data-key="visits"
        :x-tick-formatter="h => `${h}h`"
      >
        <Tooltip :cursor="false" />
      </Heatmap>
      <Button
        size="sm"
        variant="outline"
        @click="visits = traffic()"
      >
        New week
      </Button>
    </section>

    <section class="rounded-xl border p-6 space-y-4">
      <h2 class="font-medium">
        Retention by signup month
      </h2>
      <CohortChart
        :data="retention"
        :mode="cohortMode"
        :period-formatter="i => `Month ${i}`"
      >
        <Tooltip :cursor="false" />
      </CohortChart>
      <div class="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          @click="retention = cohorts()"
        >
          New cohorts
        </Button>
        <Button
          size="sm"
          variant="outline"
          @click="cohortMode = cohortMode === 'percent' ? 'count' : 'percent'"
        >
          Show {{ cohortMode === 'percent' ? 'counts' : 'percent' }}
        </Button>
      </div>
    </section>
  </div>
</template>
