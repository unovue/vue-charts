<script setup lang="ts">
import { CategoryAxisModule, LegendModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community'
import { AgCharts } from 'ag-charts-vue3'
import { computed } from 'vue'
import type { LineRow } from './data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule])

function line(yKey: keyof LineRow, yName: string) {
  return {
    type: 'line' as const,
    xKey: 'month',
    yKey,
    yName,
    marker: { enabled: false },
    interpolation: { type: 'smooth' as const },
  }
}

const options = computed(() => ({
  theme: props.dark ? 'ag-default-dark' as const : 'ag-default' as const,
  background: { visible: false },
  height: 300,
  data: props.data,
  tooltip: { mode: 'shared' as const },
  series: [line('desktop', 'Desktop'), line('mobile', 'Mobile'), line('tablet', 'Tablet')],
}))
</script>

<template>
  <AgCharts :options="options" />
</template>
