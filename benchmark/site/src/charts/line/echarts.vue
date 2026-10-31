<script setup lang="ts">
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { LineRow } from './data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

use([CanvasRenderer, GridComponent, LegendComponent, LineChart, TooltipComponent])

function line(name: string, key: keyof LineRow) {
  return {
    name,
    type: 'line' as const,
    smooth: true,
    smoothMonotone: 'x' as const,
    showSymbol: false,
    data: props.data.map(row => row[key]),
  }
}

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' as const },
  legend: {},
  xAxis: { type: 'category' as const, data: props.data.map(row => row.month) },
  yAxis: { type: 'value' as const },
  series: [line('Desktop', 'desktop'), line('Mobile', 'mobile'), line('Tablet', 'tablet')],
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
