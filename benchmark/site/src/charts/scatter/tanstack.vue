<script setup lang="ts">
import { colorLegend, defineChart, dot } from '@tanstack/charts'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { computed } from 'vue'
import type { ScatterRow } from '../datasets'

const props = defineProps<{ data: ScatterRow[], dark: boolean }>()

const definition = computed(() => defineChart({
  marks: [dot(props.data.map((row, index) => ({ ...row, id: `${row.group}-${index}` })), { x: 'x', y: 'y', z: 'group', key: 'id' })],
  scales: {
    x: { scale: scaleLinear, nice: true, grid: true },
    y: { scale: scaleLinear, nice: true, grid: true },
  },
  color: { legend: colorLegend() },
  svgAnimation: true,
  tooltip,
}))
</script>

<template>
  <div :style="{ color: dark ? '#e4e4e7' : '#18181b' }">
    <Chart
      :definition="definition"
      aria-label="Points by device"
      :height="300"
    />
  </div>
</template>
