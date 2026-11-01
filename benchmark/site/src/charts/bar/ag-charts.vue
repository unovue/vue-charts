<script setup lang="ts">
import { BarSeriesModule, CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community'
import { AgCharts } from 'ag-charts-vue3'
import { computed } from 'vue'
import type { BarRow } from '../datasets'

const props = defineProps<{ data: BarRow[], dark: boolean }>()

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule])

function bar(yKey: keyof BarRow, yName: string) {
  return {
    type: 'bar' as const,
    xKey: 'segment',
    yKey,
    yName,
  }
}

const options = computed(() => ({
  theme: props.dark ? 'ag-default-dark' as const : 'ag-default' as const,
  background: { visible: false },
  height: 300,
  data: props.data,
  tooltip: { mode: 'shared' as const },
  series: [bar('desktop', 'Desktop'), bar('mobile', 'Mobile'), bar('tablet', 'Tablet')],
}))
</script>

<template>
  <AgCharts :options="options" />
</template>
