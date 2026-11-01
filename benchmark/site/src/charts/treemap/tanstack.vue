<script setup lang="ts">
import { defineChart } from '@tanstack/charts'
import { treemap } from '@tanstack/charts/hierarchy/treemap'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { computed } from 'vue'
import type { TreemapRow } from '../datasets'

const props = defineProps<{ data: TreemapRow[], dark: boolean }>()

const definition = computed(() => defineChart({
  marks: [
    treemap(props.data, {
      path: row => `${row.group}/${row.name}`,
      value: 'value',
      color: node => node.data?.group,
      label: 'name',
      paddingInner: 1,
    }),
  ],
  scales: { x: null, y: null },
  guides: false,
  margin: 0,
  svgAnimation: true,
  tooltip: { use: tooltip, format: ({ datum }) => `${datum.name}: ${datum.value}` },
}))
</script>

<template>
  <div :style="{ color: dark ? '#e4e4e7' : '#18181b' }">
    <Chart
      :definition="definition"
      aria-label="Module sizes"
      :height="300"
    />
  </div>
</template>
