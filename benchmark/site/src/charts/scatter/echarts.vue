<script setup lang="ts">
import { ScatterChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { ScatterRow } from '../datasets'

const props = defineProps<{ data: ScatterRow[], dark: boolean }>()

use([CanvasRenderer, GridComponent, LegendComponent, ScatterChart, TooltipComponent])

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {},
  legend: {},
  xAxis: { type: 'value' as const },
  yAxis: { type: 'value' as const },
  series: ['Desktop', 'Mobile'].map(name => ({
    name,
    type: 'scatter' as const,
    data: props.data.filter(row => row.group === name).map(row => [row.x, row.y]),
  })),
}))
</script>

<template>
  <VChart
    style="height: 300px"
    :option="option"
    :theme="dark ? 'dark' : ''"
    autoresize
  />
</template>
