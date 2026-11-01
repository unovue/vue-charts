<script setup lang="ts">
import { computed } from 'vue'
import { VueUiOnion } from 'vue-data-ui/vue-ui-onion'
import 'vue-data-ui/style.css'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

const dataset = computed(() => props.data.map(row => ({ name: row.name, value: row.value, percentage: row.value / 3 })))

const config = computed(() => ({
  theme: props.dark ? 'dark' as const : '' as const,
  userOptions: { show: false },
  table: { show: false },
  style: { chart: { backgroundColor: 'transparent' } },
}))
</script>

<template>
  <VueUiOnion
    :dataset="dataset"
    :config="config"
  />
</template>
