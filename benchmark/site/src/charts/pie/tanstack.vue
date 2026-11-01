<script setup lang="ts">
import { colorLegend, defineChart } from '@tanstack/charts'
import { pie, polar, radialArc } from '@tanstack/charts/polar'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { computed } from 'vue'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

const definition = computed(() => defineChart({
  marks: [
    polar({
      inset: 8,
      radiusRatio: 0.82,
      marks: [
        radialArc(pie(props.data, { value: 'value' }), {
          innerRadius: ({ radius }) => radius * 0.58,
          color: 'name',
          key: 'name',
        }),
      ],
      scales: { angle: null, radius: null },
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
