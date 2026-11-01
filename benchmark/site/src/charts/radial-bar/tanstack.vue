<script setup lang="ts">
import { colorLegend, defineChart } from '@tanstack/charts'
import { polar, radialBarAngle } from '@tanstack/charts/polar'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { computed } from 'vue'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

const definition = computed(() => defineChart({
  marks: [
    polar({
      radiusRatio: 0.8,
      scales: {
        angle: { scale: scaleLinear().domain([0, 300]) },
        radius: {
          scale: () => scaleBand<string>().padding(0.12),
          range: [({ radius }) => radius * 0.3, ({ radius }) => radius],
        },
      },
      marks: [radialBarAngle(props.data, { radius: 'name', angle: 'value', color: 'name', key: 'name' })],
    }),
  ],
  scales: { x: null, y: null },
  color: { legend: colorLegend() },
  svgAnimation: true,
  tooltip: { use: tooltip, format: ({ datum }) => `${datum.name}: ${datum.value}` },
}))
</script>

<template>
  <div :style="{ color: dark ? '#e4e4e7' : '#18181b' }">
    <Chart
      :definition="definition"
      aria-label="Visitors by browser"
      :height="300"
    />
  </div>
</template>
