<script setup lang="ts">
import { Chart, Colors, Legend, LinearScale, PointElement, Tooltip } from 'chart.js'
import { computed } from 'vue'
import { Scatter } from 'vue-chartjs'
import type { ScatterRow } from '../datasets'

const props = defineProps<{ data: ScatterRow[], dark: boolean }>()

Chart.register(Colors, Legend, LinearScale, PointElement, Tooltip)

const chartData = computed(() => ({
  datasets: ['Desktop', 'Mobile'].map(group => ({
    label: group,
    data: props.data.filter(row => row.group === group).map(({ x, y }) => ({ x, y })),
  })),
}))

const options = computed(() => {
  const text = props.dark ? '#d4d4d8' : '#666'
  const grid = props.dark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'
  return {
    responsive: true,
    maintainAspectRatio: false,
    color: text,
    scales: {
      x: { ticks: { color: text }, grid: { color: grid } },
      y: { ticks: { color: text }, grid: { color: grid } },
    },
  }
})
</script>

<template>
  <div style="height: 300px">
    <Scatter
      :data="chartData"
      :options="options"
    />
  </div>
</template>
