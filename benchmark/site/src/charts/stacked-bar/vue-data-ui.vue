<script setup lang="ts">
import { computed } from 'vue'
import { VueUiStackbar } from 'vue-data-ui/vue-ui-stackbar'
import 'vue-data-ui/style.css'
import type { BarRow } from '../datasets'

const props = defineProps<{ data: BarRow[], dark: boolean }>()

function bar(name: string, key: 'desktop' | 'mobile' | 'tablet') {
  return { name, series: props.data.map(row => row[key]) }
}

const dataset = computed(() => [bar('Desktop', 'desktop'), bar('Mobile', 'mobile'), bar('Tablet', 'tablet')])

const config = computed(() => ({
  theme: props.dark ? 'dark' as const : '' as const,
  userOptions: { show: false },
  table: { show: false },
  style: {
    chart: {
      backgroundColor: 'transparent',
      zoom: { show: false },
      bars: { dataLabels: { show: false }, totalValues: { show: false } },
      grid: { x: { timeLabels: { values: props.data.map(row => row.segment) } } },
    },
  },
}))
</script>

<template>
  <VueUiStackbar
    :dataset="dataset"
    :config="config"
  />
</template>
