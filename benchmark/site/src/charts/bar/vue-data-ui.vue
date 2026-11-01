<script setup lang="ts">
import { computed } from 'vue'
import { VueUiXy } from 'vue-data-ui/vue-ui-xy'
import 'vue-data-ui/style.css'
import type { BarRow } from '../datasets'

const props = defineProps<{ data: BarRow[], dark: boolean }>()

function bar(name: string, key: 'desktop' | 'mobile' | 'tablet') {
  return { name, type: 'bar' as const, series: props.data.map(row => row[key]) }
}

const dataset = computed(() => [bar('Desktop', 'desktop'), bar('Mobile', 'mobile'), bar('Tablet', 'tablet')])

const config = computed(() => ({
  theme: props.dark ? 'dark' as const : '' as const,
  chart: {
    backgroundColor: 'transparent',
    grid: { labels: { xAxisLabels: { values: props.data.map(row => row.segment) } } },
    zoom: { show: false },
    userOptions: { show: false },
  },
  table: { show: false },
}))
</script>

<template>
  <VueUiXy
    :dataset="dataset"
    :config="config"
  />
</template>
