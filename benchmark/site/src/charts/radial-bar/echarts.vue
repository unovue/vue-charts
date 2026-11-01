<script setup lang="ts">
import { BarChart } from 'echarts/charts'
import { PolarComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

use([BarChart, CanvasRenderer, PolarComponent, TooltipComponent])

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {},
  polar: { radius: ['15%', '75%'] },
  angleAxis: { type: 'value' as const, startAngle: 90 },
  radiusAxis: { type: 'category' as const, data: props.data.map(row => row.name) },
  series: [{
    type: 'bar' as const,
    name: 'Visitors',
    coordinateSystem: 'polar' as const,
    colorBy: 'data' as const,
    data: props.data.map(row => row.value),
  }],
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
