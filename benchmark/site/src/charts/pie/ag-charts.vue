<script setup lang="ts">
import { DonutSeriesModule, LegendModule, ModuleRegistry } from 'ag-charts-community'
import { AgCharts } from 'ag-charts-vue3'
import { computed } from 'vue'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

ModuleRegistry.registerModules([DonutSeriesModule, LegendModule])

const options = computed(() => ({
  theme: props.dark ? 'ag-default-dark' as const : 'ag-default' as const,
  background: { visible: false },
  height: 300,
  data: props.data,
  series: [{ type: 'donut' as const, angleKey: 'value', legendItemKey: 'name', innerRadiusRatio: 0.6 }],
}))
</script>

<template>
  <AgCharts :options="options" />
</template>
