<script setup lang="ts">
import { areaY, barY, colorLegend, defineChart, lineY } from '@tanstack/charts'
import { d3Curve } from '@tanstack/charts/d3/shape'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { curveMonotoneX } from 'd3-shape'
import { computed } from 'vue'
import type { LineRow } from '../line/data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

const definition = computed(() => {
  const curve = d3Curve(curveMonotoneX)
  const rows = (series: string, key: 'desktop' | 'mobile' | 'tablet') => props.data.map(row => ({ month: row.month, series, value: row[key] }))
  return defineChart({
    marks: [
      barY(rows('Desktop', 'desktop'), { x: 'month', y: 'value', z: 'series' }),
      areaY(rows('Tablet', 'tablet'), { x: 'month', y: 'value', z: 'series', curve }),
      lineY(rows('Mobile', 'mobile'), { x: 'month', y: 'value', z: 'series', curve }),
    ],
    scales: {
      x: { scale: () => scaleBand<string>().padding(0.2) },
      y: { scale: scaleLinear, nice: true, grid: true },
    },
    color: { domain: ['Desktop', 'Mobile', 'Tablet'], legend: colorLegend() },
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
