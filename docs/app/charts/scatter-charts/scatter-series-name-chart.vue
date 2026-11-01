<script setup>
import { CartesianGrid, Legend, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'vccs'

const desktop = [
  { x: 100, y: 200 },
  { x: 120, y: 100 },
  { x: 170, y: 300 },
  { x: 140, y: 250 },
  { x: 150, y: 400 },
  { x: 110, y: 280 },
]

const mobile = [
  { x: 200, y: 260 },
  { x: 240, y: 290 },
  { x: 190, y: 290 },
  { x: 198, y: 250 },
  { x: 180, y: 280 },
  { x: 210, y: 220 },
]
</script>

<template>
  <ScatterChart :height="300">
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis
      data-key="x"
      type="number"
    />
    <YAxis
      data-key="y"
      type="number"
    />
    <Tooltip
      :cursor="false"
      :label-formatter="(_, payload) => payload[0]?.seriesName"
    />
    <Legend />
    <Scatter
      name="Desktop"
      :data="desktop"
      fill="#f97316"
    />
    <Scatter
      name="Mobile"
      :data="mobile"
      fill="#14b8a6"
    />
  </ScatterChart>
</template>
