<script setup lang="ts">
import { RadarChart } from 'echarts/charts'
import { LegendComponent, RadarComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { RadarRow } from '../datasets'

const props = defineProps<{ data: RadarRow[], dark: boolean }>()

use([CanvasRenderer, LegendComponent, RadarChart, RadarComponent, TooltipComponent])

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {},
  legend: {},
  radar: { indicator: props.data.map(row => ({ name: row.subject, max: 150 })) },
  series: [{
    type: 'radar' as const,
    areaStyle: {},
    data: [
      { name: 'Desktop', value: props.data.map(row => row.desktop) },
      { name: 'Mobile', value: props.data.map(row => row.mobile) },
    ],
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
