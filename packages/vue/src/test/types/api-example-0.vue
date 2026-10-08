<script setup lang="ts">
import { Bar, BarChart, Brush, CartesianGrid, Legend, Tooltip, XAxis, YAxis, defineChartComponents } from '../../index'
import { ref } from 'vue'

interface Visit { date: string, desktop: number, mobile: number }
const Chart = defineChartComponents<Visit>()({ Bar, BarChart, Brush, Legend, Tooltip, XAxis, YAxis })
const rows = ref<Visit[]>([
  { date: '2026-10-01', desktop: 24, mobile: 18 },
  { date: '2026-10-02', desktop: 31, mobile: 22 },
])

const active = ref<number | null>(null) // shared with a table
const hidden = ref<Array<keyof Visit>>([])
const range = ref<{ startIndex: number, endIndex: number } | null>({ startIndex: 0, endIndex: 1 })
const selectedDate = ref('')
</script>

<template>
  <!-- responsive by default; child contracts are typed through Chart -->
  <Chart.BarChart
    :data="rows"
    :height="300"
    title="Visits per day"
    :transition="{ duration: 0.4 }"
  >
    <CartesianGrid :vertical="false" />
    <Chart.XAxis
      data-key="date"
      orientation="bottom"
      :tick-formatter="d => String(d).slice(5)"
    />
    <Chart.YAxis />
    <!-- data-key autocompletes 'desktop' | 'mobile'; color from --v-charts-series-1/2 -->
    <Chart.Bar
      data-key="desktop"
      stack-id="a"
      @click="entry => selectedDate = entry.payload.date"
    >
      <template #shape="{ x, y, width, height, fill }">
        <rect
          :x
          :y
          :width
          :height
          :fill
          :rx="4"
        />
      </template>
    </Chart.Bar>
    <Chart.Bar
      data-key="mobile"
      stack-id="a"
    />
    <Chart.Tooltip
      v-model:active-index="active"
      :cursor="false"
    >
      <template #content="{ active: shown, label, payload }">
        <!-- payload[0].payload is Visit -->
        <div v-if="shown">
          {{ label }}: {{ payload[0]?.payload.desktop }}
        </div>
      </template>
    </Chart.Tooltip>
    <Chart.Legend v-model:hidden="hidden" />
    <Chart.Brush v-model:range="range" />
  </Chart.BarChart>
  <p>Selected day: {{ selectedDate }}</p>
</template>
