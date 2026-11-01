<script setup lang="ts">
import { computed } from 'vue'
import { VueUiXy } from 'vue-data-ui/vue-ui-xy'
import 'vue-data-ui/style.css'
import type { LineRow } from './data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

function line(name: string, key: keyof LineRow) {
  return {
    name,
    type: 'line' as const,
    smooth: true,
    series: props.data.map(row => row[key] as number),
  }
}

const dataset = computed(() => [line('Desktop', 'desktop'), line('Mobile', 'mobile'), line('Tablet', 'tablet')])

const config = computed(() => ({
  theme: props.dark ? 'dark' as const : '' as const,
  chart: {
    backgroundColor: 'transparent',
    grid: { labels: { xAxisLabels: { values: props.data.map(row => row.month) } } },
    highlighter: { useLine: true },
    zoom: { show: false },
    userOptions: { show: false },
  },
  line: { dot: { hideAboveMaxSerieLength: 0 } },
  table: { show: false },
}))
</script>

<template>
  <VueUiXy
    :dataset="dataset"
    :config="config"
  />
</template>
