<script setup lang="ts">
import { TreemapChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed } from 'vue'
import VChart from 'vue-echarts'
import type { TreemapRow } from '../datasets'

const props = defineProps<{ data: TreemapRow[], dark: boolean }>()

use([CanvasRenderer, TooltipComponent, TreemapChart])

const option = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {},
  series: [{
    type: 'treemap' as const,
    name: 'Modules',
    roam: false,
    nodeClick: false as const,
    breadcrumb: { show: false },
    data: [...new Set(props.data.map(row => row.group))].map(name => ({
      name,
      children: props.data.filter(row => row.group === name),
    })),
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
