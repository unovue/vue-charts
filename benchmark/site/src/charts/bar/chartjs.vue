<script setup lang="ts">
import { BarElement, CategoryScale, Chart, Colors, Legend, LinearScale, Tooltip } from 'chart.js'
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import type { BarRow } from '../datasets'

const props = defineProps<{ data: BarRow[], dark: boolean }>()

Chart.register(BarElement, CategoryScale, Colors, Legend, LinearScale, Tooltip)

const chartData = computed(() => ({
  labels: props.data.map(row => row.segment),
  datasets: [
    { label: 'Desktop', data: props.data.map(row => row.desktop) },
    { label: 'Mobile', data: props.data.map(row => row.mobile) },
    { label: 'Tablet', data: props.data.map(row => row.tablet) },
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
    scales: {
      x: { ticks: { color: text }, grid: { color: grid } },
      y: { ticks: { color: text }, grid: { color: grid } },
    },
  }
})
</script>

<template>
  <div style="height: 300px">
    <Bar
      :data="chartData"
      :options="options"
    />
  </div>
</template>
