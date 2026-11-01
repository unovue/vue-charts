<script setup lang="ts">
import { colorLegend, defineChart } from '@tanstack/charts'
import { angleGrid, focusGroupAngle, polar, radialArea, radialGrid } from '@tanstack/charts/polar'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { curveLinearClosed } from 'd3-shape'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { computed } from 'vue'
import type { RadarRow } from '../datasets'

const props = defineProps<{ data: RadarRow[], dark: boolean }>()

const definition = computed(() => {
  const rows = props.data.flatMap(row => [
    { subject: row.subject, series: 'Desktop', value: row.desktop },
    { subject: row.subject, series: 'Mobile', value: row.mobile },
  ])
  return defineChart({
    marks: [
      polar({
        radiusRatio: 0.72,
        scales: {
          angle: { scale: scalePoint<string>().domain(props.data.map(row => row.subject)), wrap: true },
          radius: { scale: scaleLinear().domain([0, 150]) },
        },
        guides: [radialGrid({ shape: 'polygon' }), angleGrid({ labels: true })],
        marks: [
          radialArea(rows, { angle: 'subject', radius: 'value', z: 'series', color: 'series', curve: curveLinearClosed, fillOpacity: 0.4 }),
        ],
      }),
    ],
    scales: { x: null, y: null },
    color: { legend: colorLegend() },
    focus: focusGroupAngle,
    svgAnimation: true,
    tooltip,
  })
})
</script>

<template>
  <div :style="{ color: dark ? '#e4e4e7' : '#18181b' }">
    <Chart
      :definition="definition"
      aria-label="Scores by device"
      :height="300"
    />
  </div>
</template>
