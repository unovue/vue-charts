<script setup lang="ts">
import { PieChart } from 'echarts/charts'
import { LegendComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

use([CanvasRenderer, LegendComponent, PieChart, TooltipComponent])

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' as const },
  legend: {},
  series: [{ type: 'pie' as const, name: 'Visitors', radius: ['40%', '70%'], label: { show: false }, data: props.data }],
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
