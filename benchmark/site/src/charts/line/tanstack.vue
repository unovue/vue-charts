<script setup lang="ts">
import { colorLegend, crosshair, defineChart, lineY } from '@tanstack/charts'
import { d3Curve } from '@tanstack/charts/d3/shape'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { curveMonotoneX } from 'd3-shape'
import { computed } from 'vue'
import type { LineRow } from './data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

const definition = computed(() => {
  const rows = props.data.flatMap(row => [
    { month: row.month, series: 'Desktop', value: row.desktop },
    { month: row.month, series: 'Mobile', value: row.mobile },
    { month: row.month, series: 'Tablet', value: row.tablet },
  ])
  return defineChart({
    marks: [
      lineY(rows, { x: 'month', y: 'value', z: 'series', curve: d3Curve(curveMonotoneX) }),
      crosshair({ y: false }),
    ],
    scales: {
      x: { scale: () => scalePoint<string>().padding(0.2) },
      y: { scale: scaleLinear, nice: true, grid: true },
    },
    color: { legend: colorLegend() },
    focus: 'group-x',
    maxFocusDistance: Number.POSITIVE_INFINITY,
    svgAnimation: true,
    tooltip,
  })
})
</script>

<template>
  <div :style="{ color: dark ? '#e4e4e7' : '#18181b' }">
    <Chart
      :definition="definition"
      aria-label="Visitors by device"
      :height="300"
    />
  </div>
</template>
