<script setup lang="ts">
import { SankeyChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { SankeyData } from '../datasets'

const props = defineProps<{ data: SankeyData, dark: boolean }>()

use([CanvasRenderer, SankeyChart, TooltipComponent])

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {},
  series: [{
    type: 'sankey' as const,
    data: props.data.nodes.map(node => ({ name: node.id })),
    links: props.data.links,
    emphasis: { focus: 'adjacency' as const },
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
