<script setup lang="ts">
import { BarController, BarElement, CategoryScale, Chart as ChartJS, Colors, Filler, Legend, LineController, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js'
import { computed } from 'vue'
import { Chart } from 'vue-chartjs'
import type { LineRow } from '../line/data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

ChartJS.register(BarController, BarElement, CategoryScale, Colors, Filler, Legend, LineController, LineElement, LinearScale, PointElement, Tooltip)

const chartData = computed(() => ({
  labels: props.data.map(row => row.month),
  datasets: [
    { type: 'bar' as const, label: 'Desktop', order: 3, data: props.data.map(row => row.desktop) },
    { type: 'line' as const, label: 'Mobile', order: 1, data: props.data.map(row => row.mobile) },
    { type: 'line' as const, label: 'Tablet', order: 2, fill: 'origin', data: props.data.map(row => row.tablet) },
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
      y: { beginAtZero: true, ticks: { color: text }, grid: { color: grid } },
    },
  }
})
</script>

<template>
  <div style="height: 300px">
    <Chart
      type="bar"
      :data="chartData"
      :options="options"
    />
  </div>
</template>
