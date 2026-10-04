<script setup lang="ts">
import { ref } from 'vue'
import { Bar, BarChart, Brush, Legend, Line, Pie, PieChart, Sankey, Treemap } from '../index'
import type { ChartPointerState } from '../index'

const from = ref(0)
const to = ref(2)
const wrongBrush = {} as InstanceType<typeof Brush>
// @ts-expect-error Brush model values are numeric.
wrongBrush.$emit('update:startIndex', '0')

const data = [{ name: 'A', value: 10 }]
const state = {} as ChartPointerState
// @ts-expect-error A chart state does not contain arbitrary user fields.
state.missingProperty
const chart = {} as InstanceType<typeof BarChart>
// @ts-expect-error A click requires a ChartPointerState, not brush indexes.
chart.$emit('click', { startIndex: 0 }, new MouseEvent('click'))
const bar = {} as InstanceType<typeof Bar>
// @ts-expect-error Item click requires its index and native event.
bar.$emit('click', {})
// @ts-expect-error Animation end carries no payload.
bar.$emit('animation-end', 1) // eslint-disable-line vue/custom-event-name-casing
const brush = {} as InstanceType<typeof Brush>
// @ts-expect-error Both brush bounds are required.
brush.$emit('change', { startIndex: 0 })
</script>

<template>
  <BarChart
    :data="data"
    :width="400"
    :height="300"
    @click="(state, event) => { state.activeIndex; event.preventDefault() }"
    @touchmove="(state, event) => { state.isTooltipActive; event.preventDefault() }"
  >
    <Bar
      data-key="value"
      @click="(entry, index, event) => { entry.tooltipPosition.x; index.toFixed(); event.preventDefault() }"
      @animation-end="() => {}"
    />
    <Line
      data-key="value"
      @mouseenter="(entry, index, event) => { entry.x; index.toFixed(); event.preventDefault() }"
      @animation-start="() => {}"
    />
    <Brush
      v-model:start-index="from"
      v-model:end-index="to"
      @change="({ startIndex }) => startIndex.toFixed()"
      @drag-end="({ endIndex }) => endIndex.toFixed()"
    />
    <Legend @click="(entry, index, event) => { entry.value.toUpperCase(); index.toFixed(); event.preventDefault() }" />
  </BarChart>
  <PieChart
    :width="400"
    :height="300"
  >
    <Pie
      :data="data"
      data-key="value"
      @click="(entry, index, event) => { entry.midAngle.toFixed(); index.toFixed(); event.preventDefault() }"
      @animation-end="() => {}"
    />
  </PieChart>
  <Treemap
    :data="data"
    :width="400"
    :height="300"
    @node-click="(node, index, event) => { node.width.toFixed(); index.toFixed(); event.preventDefault() }"
  />
  <Sankey
    :data="{ nodes: [{ name: 'A' }, { name: 'B' }], links: [{ source: 0, target: 1, value: 10 }] }"
    :width="400"
    :height="300"
    @link-click="(link, index, event) => { link.value.toFixed(); index.toFixed(); event.preventDefault() }"
  />
  <!-- @vue-expect-error Chart listeners must infer the state shape. -->
  <BarChart @click="(state) => state.missingProperty" />
  <!-- @vue-expect-error Brush listeners must infer the range shape. -->
  <Brush @change="(range) => range.missingProperty" />
  <!-- @vue-expect-error Item listeners must infer the geometry shape. -->
  <Bar
    data-key="value"
    @click="(entry) => entry.missingProperty"
  />
</template>
