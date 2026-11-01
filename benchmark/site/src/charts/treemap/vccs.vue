<script setup lang="ts">
import { computed } from 'vue'
import { Tooltip, Treemap } from 'vccs'
import type { TreemapRow } from '../datasets'

const props = defineProps<{ data: TreemapRow[], dark: boolean }>()

const darkTokens = { '--v-charts-text': '#a1a1aa', '--v-charts-axis': '#52525b', '--v-charts-cursor': '#52525b' }
const colors = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
const tree = computed(() => [...new Set(props.data.map(row => row.group))].map(name => ({
  name,
  children: props.data.filter(row => row.group === name),
})))
</script>

<template>
  <div :style="dark ? darkTokens : undefined">
    <Treemap
      :data="tree"
      data-key="value"
      :colors="colors"
      :height="300"
    >
      <Tooltip />
    </Treemap>
  </div>
</template>
