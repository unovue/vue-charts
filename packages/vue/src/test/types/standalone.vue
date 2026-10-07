<script setup lang="ts">
import { BarList, CalendarHeatmap, CohortChart, Heatmap, JourneySankey, Sparkline, Tracker, defineChartComponents } from '../../index'

interface Hit { weekday: string, hour: number, visits: number, nested: { value: number } }
interface Day { date: string, value: number, detail: string }
interface Cohort { cohort: string, values: number[], detail: string }
interface Journey { path: string[], count: number, detail: string }
const hits: Hit[] = [{ weekday: 'Mon', hour: 9, visits: 3, nested: { value: 3 } }]
const days: Day[] = [{ date: '2026-10-01', value: 3, detail: 'source' }]
const cohorts: Cohort[] = [{ cohort: 'Oct', values: [3, 2], detail: 'source' }]
interface DeepRow { x: number, y: number, metrics: { visits: { daily: { hourly: { latest: { value: number } } } } } }
const deepRows: DeepRow[] = [{ x: 1, y: 1, metrics: { visits: { daily: { hourly: { latest: { value: 3 } } } } } }]
const journeys: Journey[] = [{ path: ['A', 'B'], count: 3, detail: 'source' }]
const Chart = defineChartComponents<Hit>()({ Heatmap, Tracker, BarList, Sparkline })
function numeric(value: number | undefined) { return value }
function text(value: string | undefined) { return value }
</script>

<template>
  <Heatmap
    :data="deepRows"
    x-key="x"
    y-key="y"
    data-key="metrics.visits.daily.hourly.latest.value"
  />
  <Heatmap
    :data="hits"
    x-key="hour"
    y-key="weekday"
    data-key="nested.value"
    @cell-click="(cell, index, event) => { numeric(cell.rows[0]?.hour); numeric(index); text('key' in event ? event.key : event.type) }"
  >
    <template #cell="{ cell }">
      {{ numeric(cell.payload.rows[0]?.hour) }}
    </template>
  </Heatmap>
  <Heatmap
    :data="hits"
    :x-key="row => row.hour"
    :y-key="row => row.weekday"
    :data-key="row => row.visits"
  />
  <!-- @vue-expect-error A deep path must start at an actual row key. -->
  <Heatmap
    :data="deepRows"
    data-key="nope.visits.daily.hourly.latest.value"
  />
  <!-- @vue-expect-error Invalid row key. -->
  <Heatmap
    :data="hits"
    x-key="nope"
  />
  <!-- @vue-expect-error A heatmap aggregate is not a Hit row. -->
  <Heatmap
    :data="hits"
    @cell-click="cell => numeric(cell.hour)"
  />
  <CalendarHeatmap
    :data="days"
    @cell-click="day => text(day.rows[0]?.detail)"
  >
    <template #cell="{ cell }">
      {{ text(cell.payload.rows[0]?.detail) }}
    </template>
  </CalendarHeatmap>
  <!-- @vue-expect-error Calendar payload has derived fields, not row fields. -->
  <CalendarHeatmap
    :data="days"
    @cell-click="day => text(day.detail)"
  />
  <CohortChart
    :data="cohorts"
    @cell-click="cell => text(cell.row.detail)"
  >
    <template #cell="{ cell }">
      {{ text(cell.payload.row.detail) }} {{ numeric(cell.payload.period) }}
    </template>
  </CohortChart>
  <!-- @vue-expect-error Cohort payload carries the source under row. -->
  <CohortChart
    :data="cohorts"
    @cell-click="cell => text(cell.detail)"
  />
  <JourneySankey
    :data="journeys"
    @node-click="node => text(node.rows[0]?.detail)"
    @link-click="link => text(link.rows[0]?.detail)"
  >
    <template #label="{ node }">
      {{ text(node.rows[0]?.detail) }}
    </template>
  </JourneySankey>
  <!-- @vue-expect-error Journey node is an aggregate. -->
  <JourneySankey
    :data="journeys"
    @node-click="node => text(node.detail)"
  />
  <Tracker
    :data="hits"
    data-key="visits"
    name-key="weekday"
    @cell-click="row => numeric(row.hour)"
  />
  <BarList
    :data="hits"
    data-key="visits"
    name-key="weekday"
    @row-click="row => numeric(row.hour)"
  >
    <template #name="{ row }">
      {{ numeric(row.hour) }}
    </template>
  </BarList>
  <Sparkline
    :data="hits"
    data-key="visits"
    name-key="weekday"
  />
  <Sparkline :data="[1, 2, 3]" />
  <Chart.Heatmap
    :data="hits"
    x-key="hour"
    @cell-click="cell => numeric(cell.rows[0]?.hour)"
  />
  <Chart.Tracker
    :data="hits"
    data-key="visits"
    @cell-click="row => numeric(row.hour)"
  />
  <Chart.BarList
    :data="hits"
    data-key="visits"
    @row-click="row => numeric(row.hour)"
  />
  <Chart.Sparkline
    :data="hits"
    data-key="visits"
  />
  <!-- @vue-expect-error Selected standalone key must be a Hit key. -->
  <Chart.Heatmap
    :data="hits"
    x-key="nope"
  />
</template>
