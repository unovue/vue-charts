<script setup lang="ts">
import { Scatter } from '@unovis/ts'
import { VisAxis, VisBulletLegend, VisScatter, VisTooltip, VisXYContainer } from '@unovis/vue'
import type { ScatterRow } from '../datasets'

defineProps<{ data: ScatterRow[], dark: boolean }>()

const colors = { Desktop: 'var(--vis-color0)', Mobile: 'var(--vis-color1)' }
const legendItems = [{ name: 'Desktop', color: colors.Desktop }, { name: 'Mobile', color: colors.Mobile }]
const x = (row: ScatterRow) => row.x
const y = (row: ScatterRow) => row.y
const color = (row: ScatterRow) => colors[row.group]
const triggers = { [Scatter.selectors.point]: (row: ScatterRow) => `<b>${row.group}</b><br>x ${row.x}<br>y ${row.y}` }
</script>

<template>
  <div>
    <VisBulletLegend :items="legendItems" />
    <VisXYContainer
      :data="data"
      :height="276"
    >
      <VisScatter
        :x="x"
        :y="y"
        :color="color"
      />
      <VisAxis type="x" />
      <VisAxis type="y" />
      <VisTooltip :triggers="triggers" />
    </VisXYContainer>
  </div>
</template>
