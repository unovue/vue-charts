<script setup lang="ts">
import { computed } from 'vue'
import { VueUiStackline } from 'vue-data-ui/vue-ui-stackline'
import 'vue-data-ui/style.css'
import type { LineRow } from '../line/data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

function area(name: string, key: keyof LineRow) {
  return { name, series: props.data.map(row => row[key] as number) }
}

const dataset = computed(() => [area('Desktop', 'desktop'), area('Mobile', 'mobile'), area('Tablet', 'tablet')])

const config = computed(() => ({
  theme: props.dark ? 'dark' as const : '' as const,
  userOptions: { show: false },
  table: { show: false },
  style: {
    chart: {
      backgroundColor: 'transparent',
      zoom: { show: false },
      highlighter: { useLine: true },
      lines: {
        useArea: true,
        smooth: true,
        dot: { hideAboveMaxSerieLength: 0 },
        dataLabels: { show: false },
        totalValues: { show: false },
      },
      grid: { x: { timeLabels: { values: props.data.map(row => row.month) } } },
    },
  },
}))
</script>

<template>
  <VueUiStackline
    :dataset="dataset"
    :config="config"
  />
</template>
