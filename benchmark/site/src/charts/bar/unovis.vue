<script setup lang="ts">
import { GroupedBar } from '@unovis/ts'
import { VisAxis, VisBulletLegend, VisGroupedBar, VisTooltip, VisXYContainer } from '@unovis/vue'
import type { BarRow } from '../datasets'

const props = defineProps<{ data: BarRow[], dark: boolean }>()

const legendItems = [{ name: 'Desktop' }, { name: 'Mobile' }, { name: 'Tablet' }]
const x = (_: BarRow, index: number) => index
const y = [(row: BarRow) => row.desktop, (row: BarRow) => row.mobile, (row: BarRow) => row.tablet]
const tickFormat = (index: number) => props.data[index]?.segment ?? ''
const triggers = {
  [GroupedBar.selectors.bar]: (row: BarRow) => `<b>${row.segment}</b><br>Desktop ${row.desktop}<br>Mobile ${row.mobile}<br>Tablet ${row.tablet}`,
}
</script>

<template>
  <div>
    <VisBulletLegend :items="legendItems" />
    <VisXYContainer
      :data="data"
      :height="276"
    >
      <VisGroupedBar
        :x="x"
        :y="y"
      />
      <VisAxis
        type="x"
        :tick-format="tickFormat"
        :num-ticks="data.length"
      />
      <VisAxis type="y" />
      <VisTooltip :triggers="triggers" />
    </VisXYContainer>
  </div>
</template>
