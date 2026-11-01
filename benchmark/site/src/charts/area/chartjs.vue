<script setup lang="ts">
import { CategoryScale, Chart, Colors, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js'
import type { Plugin } from 'chart.js'
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import type { LineRow } from '../line/data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

Chart.register(CategoryScale, Colors, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip)

// Chart.js has no crosshair option; this is the usual small plugin.
const crosshair: Plugin<'line'> = {
  id: 'crosshair',
  afterDatasetsDraw(chart) {
    const active = chart.getActiveElements()[0]
    if (!active)
      return
    const { ctx, chartArea } = chart
    ctx.save()
    ctx.strokeStyle = props.dark ? '#71717a' : '#a1a1aa'
    ctx.beginPath()
    ctx.moveTo(active.element.x, chartArea.top)
    ctx.lineTo(active.element.x, chartArea.bottom)
    ctx.stroke()
    ctx.restore()
  },
}

const chartData = computed(() => ({
  labels: props.data.map(row => row.month),
  datasets: [
    { label: 'Desktop', fill: 'stack', data: props.data.map(row => row.desktop) },
    { label: 'Mobile', fill: 'stack', data: props.data.map(row => row.mobile) },
    { label: 'Tablet', fill: 'stack', data: props.data.map(row => row.tablet) },
  ],
}))

const options = computed(() => {
  const text = props.dark ? '#d4d4d8' : '#666'
  const grid = props.dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'
  return {
    responsive: true,
    maintainAspectRatio: false,
    color: text,
    interaction: { mode: 'index' as const, intersect: false },
    elements: { point: { radius: 0 }, line: { cubicInterpolationMode: 'monotone' as const } },
    scales: {
      x: { ticks: { color: text }, grid: { color: grid } },
      y: { stacked: true, beginAtZero: true, ticks: { color: text }, grid: { color: grid } },
    },
  }
})
</script>

<template>
  <div style="height: 300px">
    <Line
      :data="chartData"
      :options="options"
      :plugins="[crosshair]"
    />
  </div>
</template>
