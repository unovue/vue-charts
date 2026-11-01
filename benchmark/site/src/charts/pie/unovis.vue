<script setup lang="ts">
import { Donut } from '@unovis/ts'
import { VisBulletLegend, VisDonut, VisSingleContainer, VisTooltip } from '@unovis/vue'
import { computed } from 'vue'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

const legendItems = computed(() => props.data.map(row => ({ name: row.name })))
const value = (row: ShareRow) => row.value
const triggers = { [Donut.selectors.segment]: (segment: { data: ShareRow }) => `<b>${segment.data.name}</b> ${segment.data.value}` }
</script>

<template>
  <div>
    <VisBulletLegend :items="legendItems" />
    <VisSingleContainer
      :data="data"
      :height="276"
    >
      <VisDonut
        :value="value"
        :arc-width="40"
      />
      <VisTooltip :triggers="triggers" />
    </VisSingleContainer>
  </div>
</template>
