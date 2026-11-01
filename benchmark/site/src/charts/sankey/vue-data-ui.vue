<script setup lang="ts">
import { computed } from 'vue'
import { VueUiFlow } from 'vue-data-ui/vue-ui-flow'
import 'vue-data-ui/style.css'
import type { SankeyData } from '../datasets'

const props = defineProps<{ data: SankeyData, dark: boolean }>()

const dataset = computed(() => props.data.links.map(link => [link.source, link.target, link.value] as [string, string, number]))

const config = computed(() => ({
  theme: props.dark ? 'dark' as const : '' as const,
  userOptions: { show: false },
  table: { show: false },
  style: { chart: { backgroundColor: 'transparent' } },
}))
</script>

<template>
  <VueUiFlow
    :dataset="dataset"
    :config="config"
  />
</template>
