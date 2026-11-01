<script setup lang="ts">
import { Chart, Colors, Filler, Legend, LineElement, PointElement, RadialLinearScale, Tooltip } from 'chart.js'
import { computed } from 'vue'
import { Radar } from 'vue-chartjs'
import type { RadarRow } from '../datasets'

const props = defineProps<{ data: RadarRow[], dark: boolean }>()

Chart.register(Colors, Filler, Legend, LineElement, PointElement, RadialLinearScale, Tooltip)

const chartData = computed(() => ({
  labels: props.data.map(row => row.subject),
  datasets: [
    { label: 'Desktop', fill: true, data: props.data.map(row => row.desktop) },
    { label: 'Mobile', fill: true, data: props.data.map(row => row.mobile) },
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
      r: {
        beginAtZero: true,
        grid: { color: grid },
        angleLines: { color: grid },
        pointLabels: { color: text },
        ticks: { color: text, backdropColor: 'transparent' },
      },
    },
  }
})
</script>

<template>
  <div style="height: 300px">
    <Radar
      :data="chartData"
      :options="options"
    />
  </div>
</template>
