<script setup lang="ts">
import { Bar, BarChart, BarList, Cell, Label, LabelList, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, Sparkline, Tooltip, XAxis, YAxis } from 'vccs'
import { Button } from '@/components/ui/button'

let seed = 3
function random() {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

function series(n: number, start: number) {
  let value = start
  return Array.from({ length: n }, (_, i) => {
    value = Math.max(1, value + (random() - 0.45) * start * 0.15)
    return { day: `Day ${i + 1}`, value: Math.round(value) }
  })
}

const visitors = ref(series(30, 1200))
const revenue = ref(series(30, 400))
const errors = ref(series(30, 20))
const hovered = ref<number | null>(null)
const shown = computed(() => hovered.value ?? visitors.value.length - 1)

function nextDay() {
  for (const list of [visitors, revenue, errors]) {
    const last = list.value.at(-1)!
    list.value = [...list.value.slice(1), { day: `Day ${Number(last.day.slice(4)) + 1}`, value: Math.max(1, Math.round(last.value * (0.9 + random() * 0.2))) }]
  }
}

const pages = ref([
  { name: '/', value: 1240, url: '#' },
  { name: '/pricing', value: 820, url: '#' },
  { name: '/docs', value: 610, url: '#' },
  { name: '/blog/launch-week', value: 330, url: '#' },
  { name: '/de', value: 190, url: '#' },
])
function reshuffle() {
  pages.value = pages.value.map(page => ({ ...page, value: Math.round(100 + random() * 1300) }))
}

const browsers = [
  { name: 'Chrome', value: 640, fill: 'var(--chart-1)' },
  { name: 'Safari', value: 380, fill: 'var(--chart-2)' },
  { name: 'Firefox', value: 160, fill: 'var(--chart-3)' },
  { name: 'Other', value: 104, fill: 'var(--chart-4)' },
]
const total = browsers.reduce((sum, row) => sum + row.value, 0)

const goal = ref(72)

const steps = ref([
  { step: 'Visited', users: 4200 },
  { step: 'Signed up', users: 1680 },
  { step: 'Started trial', users: 790 },
  { step: 'Paid', users: 240 },
])
const funnel = computed(() => steps.value.map((row, i) => ({
  ...row,
  max: steps.value[0].users,
  share: i === 0 ? '100%' : `${Math.round(row.users / steps.value[i - 1].users * 100)}% of previous`,
})))
</script>

<template>
  <div class="container py-10 space-y-8 [--v-charts-muted:var(--muted)] [--v-charts-text:var(--muted-foreground)] [--v-charts-axis:var(--foreground)] [--v-charts-cursor:var(--border)] [--v-charts-background:var(--background)] [--v-charts-tooltip-background:var(--popover)] [--v-charts-tooltip-foreground:var(--popover-foreground)] [--v-charts-tooltip-border:var(--border)]">
    <div class="max-w-lg">
      <h1 class="text-2xl font-bold tracking-tight">
        Dashboard charts
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Sparkline cards, bar list, donut, gauge and funnel.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-xl border p-4 space-y-2">
        <p class="text-sm text-muted-foreground">
          Visitors · {{ visitors[shown]?.day }}
        </p>
        <p class="text-2xl font-semibold tabular-nums">
          {{ visitors[shown]?.value.toLocaleString('en-US') }}
        </p>
        <Sparkline
          v-model:active-index="hovered"
          :data="visitors"
          name-key="day"
          type="area"
          color="var(--chart-1)"
          :height="40"
        />
      </div>
      <div class="rounded-xl border p-4 space-y-2">
        <p class="text-sm text-muted-foreground">
          Revenue
        </p>
        <p class="text-2xl font-semibold tabular-nums">
          ${{ revenue.at(-1)?.value.toLocaleString('en-US') }}
        </p>
        <Sparkline
          :data="revenue"
          name-key="day"
          type="bar"
          color="var(--chart-2)"
          :height="40"
        />
      </div>
      <div class="rounded-xl border p-4 space-y-2">
        <p class="text-sm text-muted-foreground">
          Errors
        </p>
        <p class="text-2xl font-semibold tabular-nums">
          {{ errors.at(-1)?.value }}
        </p>
        <Sparkline
          :data="errors"
          name-key="day"
          color="var(--chart-5)"
          :height="40"
        />
      </div>
    </div>
    <Button
      size="sm"
      variant="outline"
      @click="nextDay"
    >
      Next day
    </Button>

    <div class="grid gap-4 md:grid-cols-2">
      <section class="rounded-xl border p-6 space-y-4">
        <div class="flex justify-between text-sm">
          <h2 class="font-medium">
            Top pages
          </h2>
          <span class="text-muted-foreground">Visitors</span>
        </div>
        <BarList
          :data="pages"
          href-key="url"
          class="text-sm"
        />
        <Button
          size="sm"
          variant="outline"
          @click="reshuffle"
        >
          New ranking
        </Button>
      </section>

      <section class="rounded-xl border p-6 space-y-4">
        <h2 class="font-medium text-sm">
          Browsers
        </h2>
        <PieChart :height="220">
          <Pie
            :data="browsers"
            data-key="value"
            name-key="name"
            :inner-radius="64"
            :outer-radius="90"
            :padding-angle="2"
            :corner-radius="4"
            stroke="none"
          >
            <Cell
              v-for="row in browsers"
              :key="row.name"
              :fill="row.fill"
            />
            <Label
              position="center"
              :value="total.toLocaleString('en-US')"
              class="fill-foreground text-2xl font-semibold"
            />
          </Pie>
          <Tooltip :cursor="false" />
        </PieChart>
      </section>

      <section class="rounded-xl border p-6 space-y-4">
        <h2 class="font-medium text-sm">
          Monthly goal
        </h2>
        <RadialBarChart
          :height="200"
          :data="[{ name: 'Goal', value: goal, fill: 'var(--chart-2)' }]"
          :start-angle="210"
          :end-angle="-30"
          :inner-radius="70"
          :outer-radius="90"
        >
          <PolarAngleAxis
            type="number"
            :domain="[0, 100]"
            :tick="false"
          />
          <RadialBar
            data-key="value"
            background
            :corner-radius="10"
          >
            <Label
              position="center"
              :value="`${goal}%`"
              class="fill-foreground text-2xl font-semibold"
            />
          </RadialBar>
        </RadialBarChart>
        <Button
          size="sm"
          variant="outline"
          @click="goal = Math.round(random() * 100)"
        >
          New value
        </Button>
      </section>

      <section class="rounded-xl border p-6 space-y-4">
        <h2 class="font-medium text-sm">
          Conversion funnel
        </h2>
        <BarChart
          :height="200"
          :data="funnel"
          layout="vertical"
          :margin="{ top: 0, right: 110, bottom: 0, left: 0 }"
        >
          <XAxis
            type="number"
            hide
            :domain="[0, 'dataMax']"
          />
          <YAxis
            type="category"
            data-key="step"
            :width="96"
            :tick-line="false"
            :axis-line="false"
          />
          <Bar
            data-key="users"
            fill="var(--chart-1)"
            :radius="4"
            :background="{ fill: 'var(--muted)', radius: 4 }"
          >
            <LabelList
              data-key="share"
              position="right"
              class="fill-muted-foreground text-xs"
            />
          </Bar>
          <Tooltip :cursor="false" />
        </BarChart>
      </section>
    </div>
  </div>
</template>
