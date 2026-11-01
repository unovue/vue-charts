<script setup lang="ts">
import { computed } from 'vue'
import { VueUiXy } from 'vue-data-ui/vue-ui-xy'
import 'vue-data-ui/style.css'
import type { LineRow } from '../line/data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

const dataset = computed(() => [
  { name: 'Desktop', type: 'bar' as const, series: props.data.map(row => row.desktop) },
  { name: 'Mobile', type: 'line' as const, smooth: true, series: props.data.map(row => row.mobile) },
  { name: 'Tablet', type: 'line' as const, smooth: true, useArea: true, series: props.data.map(row => row.tablet) },
])

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
