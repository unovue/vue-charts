<script setup lang="ts">
import { AreaSeriesModule, CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community'
import { AgCharts } from 'ag-charts-vue3'
import { computed } from 'vue'
import type { LineRow } from '../line/data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

ModuleRegistry.registerModules([AreaSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule])

function area(yKey: keyof LineRow, yName: string) {
  return {
    type: 'area' as const,
    xKey: 'month',
    yKey,
    yName,
    stacked: true,
    interpolation: { type: 'smooth' as const },
  }
}

const options = computed(() => ({
  theme: props.dark ? 'ag-default-dark' as const : 'ag-default' as const,
  background: { visible: false },
  height: 300,
  data: props.data,
  tooltip: { mode: 'shared' as const },
  series: [area('desktop', 'Desktop'), area('mobile', 'Mobile'), area('tablet', 'Tablet')],
}))
</script>

<template>
  <AgCharts :options="options" />
</template>
