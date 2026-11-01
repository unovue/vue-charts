<script setup lang="ts">
import { LegendModule, ModuleRegistry, NumberAxisModule, ScatterSeriesModule } from 'ag-charts-community'
import { AgCharts } from 'ag-charts-vue3'
import { computed } from 'vue'
import type { ScatterRow } from '../datasets'

const props = defineProps<{ data: ScatterRow[], dark: boolean }>()

ModuleRegistry.registerModules([LegendModule, NumberAxisModule, ScatterSeriesModule])

const options = computed(() => ({
  theme: props.dark ? 'ag-default-dark' as const : 'ag-default' as const,
  background: { visible: false },
  height: 300,
  series: ['Desktop', 'Mobile'].map(group => ({
    type: 'scatter' as const,
    title: group,
    data: props.data.filter(row => row.group === group),
    xKey: 'x',
    yKey: 'y',
  })),
}))
</script>

<template>
  <AgCharts :options="options" />
</template>
