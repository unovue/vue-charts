<script setup lang="ts">
import { VisAxis, VisBulletLegend, VisCrosshair, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'
import type { LineRow } from './data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

const legendItems = [{ name: 'Desktop' }, { name: 'Mobile' }, { name: 'Tablet' }]
const x = (_: LineRow, index: number) => index
const y = [(row: LineRow) => row.desktop, (row: LineRow) => row.mobile, (row: LineRow) => row.tablet]
const tickFormat = (index: number) => props.data[index]?.month ?? ''
const template = (row: LineRow) => `<b>${row.month}</b><br>Desktop ${row.desktop}<br>Mobile ${row.mobile}<br>Tablet ${row.tablet}`
</script>

<template>
  <div>
    <VisBulletLegend :items="legendItems" />
    <VisXYContainer
      :data="data"
      :height="276"
    >
      <VisLine
        :x="x"
        :y="y"
      />
      <VisAxis
        type="x"
        :tick-format="tickFormat"
        :num-ticks="12"
      />
      <VisAxis type="y" />
      <VisCrosshair
        :x="x"
        :y="y"
        :template="template"
      />
      <VisTooltip />
    </VisXYContainer>
  </div>
</template>
