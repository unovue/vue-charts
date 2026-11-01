<script setup lang="ts">
import { colorLegend, defineChart, lineY } from '@tanstack/charts'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { computed } from 'vue'

// Reference build only: the library's defaults, with straight lines, no crosshair and no animation.
const props = defineProps<{ data: { month: string, desktop: number, mobile: number, tablet: number }[], dark: boolean }>()

const definition = computed(() => {
  const rows = props.data.flatMap(row => [
    { month: row.month, series: 'Desktop', value: row.desktop },
    { month: row.month, series: 'Mobile', value: row.mobile },
    { month: row.month, series: 'Tablet', value: row.tablet },
  ])
  return defineChart({
    marks: [lineY(rows, { x: 'month', y: 'value', z: 'series' })],
    scales: {
      x: { scale: () => scalePoint<string>().padding(0.2) },
      y: { scale: scaleLinear, nice: true, grid: true },
    },
    color: { legend: colorLegend() },
    focus: 'group-x',
    tooltip,
  })
})
</script>

<template>
  <Chart
    :definition="definition"
    aria-label="Visitors by device"
    :height="300"
  />
</template>
