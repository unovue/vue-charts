<script setup lang="ts">
import { computed } from 'vue'
import { VueUiFunnel } from 'vue-data-ui/vue-ui-funnel'
import 'vue-data-ui/style.css'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

const dataset = computed(() => props.data.map(row => ({ name: row.name, value: row.value })))

const config = computed(() => ({
  theme: props.dark ? 'dark' as const : '' as const,
  userOptions: { show: false },
  table: { show: false },
  style: { chart: { backgroundColor: 'transparent' } },
}))
</script>

<template>
  <VueUiFunnel
    :dataset="dataset"
    :config="config"
  />
</template>
