<script setup lang="ts">
import { Treemap } from '@unovis/ts'
import { VisSingleContainer, VisTooltip, VisTreemap } from '@unovis/vue'
import type { TreemapRow } from '../datasets'

defineProps<{ data: TreemapRow[], dark: boolean }>()

const value = (row: TreemapRow) => row.value
const layers = [(row: TreemapRow) => row.group, (row: TreemapRow) => row.name]
const triggers = { [Treemap.selectors.tile]: (node: { data: { key: string }, value: number }) => `<b>${node.data.key}</b> ${node.value}` }
</script>

<template>
  <VisSingleContainer
    :data="data"
    :height="300"
  >
    <VisTreemap
      :value="value"
      :layers="layers"
    />
    <VisTooltip :triggers="triggers" />
  </VisSingleContainer>
</template>
