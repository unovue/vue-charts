<script setup lang="ts">
import { AreaSeriesModule, BarSeriesModule, CategoryAxisModule, LegendModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community'
import { AgCharts } from 'ag-charts-vue3'
import { computed } from 'vue'
import type { LineRow } from '../line/data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

ModuleRegistry.registerModules([AreaSeriesModule, BarSeriesModule, CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule])

const interpolation = { type: 'smooth' as const }

const options = computed(() => ({
  theme: props.dark ? 'ag-default-dark' as const : 'ag-default' as const,
  background: { visible: false },
  height: 300,
  data: props.data,
  tooltip: { mode: 'shared' as const },
  series: [
    { type: 'bar' as const, xKey: 'month', yKey: 'desktop', yName: 'Desktop' },
    { type: 'area' as const, xKey: 'month', yKey: 'tablet', yName: 'Tablet', interpolation },
    { type: 'line' as const, xKey: 'month', yKey: 'mobile', yName: 'Mobile', marker: { enabled: false }, interpolation },
  ],
}))
</script>

<template>
  <AgCharts :options="options" />
</template>
