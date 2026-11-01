<script setup lang="ts">
import { BarChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { BarRow } from '../datasets'

const props = defineProps<{ data: BarRow[], dark: boolean }>()

use([BarChart, CanvasRenderer, GridComponent, LegendComponent, TooltipComponent])

function bar(name: string, key: 'desktop' | 'mobile' | 'tablet') {
  return {
    name,
    type: 'bar' as const,
    data: props.data.map(row => row[key]),
  }
}

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' as const },
  legend: {},
  xAxis: { type: 'category' as const, data: props.data.map(row => row.segment) },
  yAxis: { type: 'value' as const },
  series: [bar('Desktop', 'desktop'), bar('Mobile', 'mobile'), bar('Tablet', 'tablet')],
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
