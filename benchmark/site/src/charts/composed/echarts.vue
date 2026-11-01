<script setup lang="ts">
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { LineRow } from '../line/data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

use([BarChart, CanvasRenderer, GridComponent, LegendComponent, LineChart, TooltipComponent])

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' as const },
  legend: {},
  xAxis: { type: 'category' as const, data: props.data.map(row => row.month) },
  yAxis: { type: 'value' as const },
  series: [
    { name: 'Desktop', type: 'bar' as const, data: props.data.map(row => row.desktop) },
    { name: 'Mobile', type: 'line' as const, smooth: true, smoothMonotone: 'x' as const, showSymbol: false, data: props.data.map(row => row.mobile) },
    { name: 'Tablet', type: 'line' as const, smooth: true, smoothMonotone: 'x' as const, showSymbol: false, areaStyle: {}, data: props.data.map(row => row.tablet) },
  ],
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
