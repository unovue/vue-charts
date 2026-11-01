<script setup lang="ts">
import { barY, colorLegend, defineChart } from '@tanstack/charts'
import { group } from '@tanstack/charts/group'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { computed } from 'vue'
import type { BarRow } from '../datasets'

const props = defineProps<{ data: BarRow[], dark: boolean }>()

const definition = computed(() => {
  const rows = props.data.flatMap(row => [
    { segment: row.segment, series: 'Desktop', value: row.desktop },
    { segment: row.segment, series: 'Mobile', value: row.mobile },
    { segment: row.segment, series: 'Tablet', value: row.tablet },
  ])
  return defineChart({
    marks: [barY(rows, { x: 'segment', y: 'value', z: 'series', layout: group() })],
    scales: {
      x: { scale: () => scaleBand<string>().padding(0.2) },
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
      aria-label="Visitors by segment"
      :height="300"
    />
  </div>
</template>
