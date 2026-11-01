<script setup lang="ts">
import { RadialBar } from '@unovis/ts'
import { VisBulletLegend, VisRadialBar, VisSingleContainer, VisTooltip } from '@unovis/vue'
import { computed } from 'vue'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

const legendItems = computed(() => props.data.map(row => ({ name: row.name })))
const value = (row: ShareRow) => row.value
const triggers = { [RadialBar.selectors.bar]: (segment: { data: ShareRow }) => `<b>${segment.data.name}</b> ${segment.data.value}` }
</script>

<template>
  <div>
    <VisBulletLegend :items="legendItems" />
    <VisSingleContainer
      :data="data"
      :height="276"
    >
      <VisRadialBar :value="value" />
      <VisTooltip :triggers="triggers" />
    </VisSingleContainer>
  </div>
</template>
