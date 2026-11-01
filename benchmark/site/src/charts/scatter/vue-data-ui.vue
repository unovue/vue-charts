<script setup lang="ts">
import { computed } from 'vue'
import { VueUiScatter } from 'vue-data-ui/vue-ui-scatter'
import 'vue-data-ui/style.css'
import type { ScatterRow } from '../datasets'

const props = defineProps<{ data: ScatterRow[], dark: boolean }>()

const dataset = computed(() => ['Desktop', 'Mobile'].map(name => ({
  name,
  values: props.data.filter(row => row.group === name).map(({ x, y }, index) => ({ name: `${name} ${index + 1}`, x, y })),
})))

const config = computed(() => ({
  theme: props.dark ? 'dark' as const : '' as const,
  userOptions: { show: false },
  table: { show: false },
  style: {
    backgroundColor: 'transparent',
    layout: {
      correlation: { show: false },
      dataLabels: { xAxis: { name: 'x' }, yAxis: { name: 'y' }, reverseAxisLabels: true },
      plots: { significance: { show: false } },
    },
  },
}))
</script>

<template>
  <VueUiScatter
    :dataset="dataset"
    :config="config"
  />
</template>
