<script setup lang="ts">
import { computed } from 'vue'
import { VueUiRadar } from 'vue-data-ui/vue-ui-radar'
import 'vue-data-ui/style.css'
import type { RadarRow } from '../datasets'

const props = defineProps<{ data: RadarRow[], dark: boolean }>()

const dataset = computed(() => ({
  categories: [{ name: 'Desktop' }, { name: 'Mobile' }],
  series: props.data.map(row => ({ name: row.subject, values: [row.desktop, row.mobile], target: 150 })),
}))

const config = computed(() => ({
  theme: props.dark ? 'dark' as const : '' as const,
  userOptions: { show: false },
  table: { show: false },
  style: { chart: { backgroundColor: 'transparent' } },
}))
</script>

<template>
  <VueUiRadar
    :dataset="dataset"
    :config="config"
  />
</template>
