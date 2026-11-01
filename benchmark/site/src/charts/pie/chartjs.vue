<script setup lang="ts">
import { ArcElement, Chart, Colors, Legend, Tooltip } from 'chart.js'
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

Chart.register(ArcElement, Colors, Legend, Tooltip)

const chartData = computed(() => ({
  labels: props.data.map(row => row.name),
  datasets: [{ label: 'Visitors', data: props.data.map(row => row.value) }],
}))

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  color: props.dark ? '#d4d4d8' : '#666',
}))
</script>

<template>
  <div style="height: 300px">
    <Doughnut
      :data="chartData"
      :options="options"
    />
  </div>
</template>
