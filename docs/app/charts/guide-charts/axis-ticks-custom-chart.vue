<script setup>
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { x: 0, y: 12 },
  { x: 117, y: 45 },
  { x: 234, y: 23 },
  { x: 351, y: 78 },
  { x: 468, y: 156 },
]

const xTicks = [0, 110, 220, 330, 440, 550]
const yTicks = [0, 40, 80, 120, 160, 200]
</script>

<template>
  <LineChart
    :data="data"
    :height="400"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis
      type="number"
      data-key="x"
      :ticks="xTicks"
    />
    <YAxis :ticks="yTicks" />
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
      data-key="y"
      stroke="#12978f"
      :is-animation-active="false"
    />
  </LineChart>
</template>
