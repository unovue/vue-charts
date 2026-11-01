<script setup lang="ts">
import { VisArea, VisAxis, VisBulletLegend, VisCrosshair, VisGroupedBar, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'
import type { LineRow } from '../line/data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

const colors = { desktop: 'var(--vis-color0)', mobile: 'var(--vis-color1)', tablet: 'var(--vis-color2)' }
const legendItems = [{ name: 'Desktop', color: colors.desktop }, { name: 'Mobile', color: colors.mobile }, { name: 'Tablet', color: colors.tablet }]
const x = (_: LineRow, index: number) => index
const desktop = (row: LineRow) => row.desktop
const mobile = (row: LineRow) => row.mobile
const tablet = (row: LineRow) => row.tablet
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
      <VisGroupedBar
        :x="x"
        :y="[desktop]"
        :color="colors.desktop"
      />
      <VisArea
        :x="x"
        :y="tablet"
        :color="colors.tablet"
      />
      <VisLine
        :x="x"
        :y="mobile"
        :color="colors.mobile"
      />
      <VisAxis
        type="x"
        :tick-format="tickFormat"
        :num-ticks="12"
      />
      <VisAxis type="y" />
      <VisCrosshair
        :x="x"
        :y="[desktop, mobile, tablet]"
        :template="template"
      />
      <VisTooltip />
    </VisXYContainer>
  </div>
</template>
