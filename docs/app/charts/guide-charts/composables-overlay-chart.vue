<script setup lang="ts">
import { defineComponent, h } from 'vue'
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis, useActiveTooltipLabel, usePlotArea, useYAxisScale } from 'vccs'

const data = [
  { month: 'Jan', visits: 186 },
  { month: 'Feb', visits: 305 },
  { month: 'Mar', visits: 237 },
  { month: 'Apr', visits: 173 },
  { month: 'May', visits: 289 },
  { month: 'Jun', visits: 314 },
]

// The composables read the chart they are rendered in, so this component
// must be a child of the chart. It draws SVG inside the chart surface.
const TargetBand = defineComponent({
  props: { from: { type: Number, required: true }, to: { type: Number, required: true } },
  setup(props) {
    const plot = usePlotArea()
    const y = useYAxisScale()
    const label = useActiveTooltipLabel()
    return () => {
      const top = y.value?.(props.to)
      const bottom = y.value?.(props.from)
      if (top == null || bottom == null)
        return null
      return h('g', [
        h('rect', { x: plot.value.x, y: top, width: plot.value.width, height: bottom - top, fill: '#14b8a6', opacity: 0.12 }),
        h('text', { 'x': plot.value.x + 8, 'y': top + 16, 'fill': '#14b8a6', 'font-size': 12 }, `Target ${props.from}–${props.to}${label.value ? ` · ${label.value}` : ''}`),
      ])
    }
  },
})
</script>

<template>
  <LineChart
    :data="data"
    :height="300"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis data-key="month" />
    <YAxis :domain="[0, 400]" />
    <TargetBand
      :from="250"
      :to="320"
    />
    <Tooltip :cursor="false">
      <template #content="{ active, payload, label }">
        <ChartTooltipContent
          :active="active"
          :payload="payload"
          :label="label"
        />
      </template>
    </Tooltip>
    <Line
      type="monotone"
      data-key="visits"
      stroke="#f97316"
    />
  </LineChart>
</template>
