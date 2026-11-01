<script setup lang="ts">
import { computed } from 'vue'
import { VueUiDonut } from 'vue-data-ui/vue-ui-donut'
import 'vue-data-ui/style.css'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

const dataset = computed(() => props.data.map(row => ({ name: row.name, values: [row.value] })))

const config = computed(() => ({
  theme: props.dark ? 'dark' as const : '' as const,
  userOptions: { show: false },
  table: { show: false },
  startAnimation: { show: true },
  style: {
    chart: {
      backgroundColor: 'transparent',
      layout: {
        labels: {
          dataLabels: { show: false },
          hollow: { show: false },
        },
      },
    },
  },
}))
</script>

<template>
  <VueUiDonut
    :dataset="dataset"
    :config="config"
  />
</template>
