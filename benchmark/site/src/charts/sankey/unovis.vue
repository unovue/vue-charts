<script setup lang="ts">
import { Sankey } from '@unovis/ts'
import { VisSankey, VisSingleContainer, VisTooltip } from '@unovis/vue'
import type { SankeyData } from '../datasets'

defineProps<{ data: SankeyData, dark: boolean }>()

const label = (node: { id: string }) => node.id
const linkValue = (link: { value: number }) => link.value
const triggers = {
  [Sankey.selectors.link]: (link: { source: { id: string }, target: { id: string }, value: number }) => `${link.source.id} → ${link.target.id}: ${link.value}`,
}
</script>

<template>
  <VisSingleContainer
    :data="data"
    :height="300"
  >
    <VisSankey
      :label="label"
      :link-value="linkValue"
    />
    <VisTooltip :triggers="triggers" />
  </VisSingleContainer>
</template>
