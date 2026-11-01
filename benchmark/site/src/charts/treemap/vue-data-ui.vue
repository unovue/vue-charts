<script setup lang="ts">
import { computed } from 'vue'
import { VueUiTreemap } from 'vue-data-ui/vue-ui-treemap'
import 'vue-data-ui/style.css'
import type { TreemapRow } from '../datasets'

const props = defineProps<{ data: TreemapRow[], dark: boolean }>()

const dataset = computed(() => [...new Set(props.data.map(row => row.group))].map((name) => {
  const children = props.data.filter(row => row.group === name).map(row => ({ name: row.name, value: row.value }))
  return { name, value: children.reduce((sum, child) => sum + child.value, 0), children }
}))

const config = computed(() => ({
  theme: props.dark ? 'dark' as const : '' as const,
  userOptions: { show: false },
  table: { show: false },
  style: { chart: { backgroundColor: 'transparent' } },
}))
</script>

<template>
  <VueUiTreemap
    :dataset="dataset"
    :config="config"
  />
</template>
