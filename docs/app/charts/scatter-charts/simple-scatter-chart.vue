<script setup>
import { CartesianGrid, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'vccs'

const data01 = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
]

const data02 = [
  { x: 200, y: 260, z: 240 },
  { x: 240, y: 290, z: 220 },
  { x: 190, y: 290, z: 250 },
  { x: 198, y: 250, z: 210 },
  { x: 180, y: 280, z: 260 },
  { x: 210, y: 220, z: 230 },
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
    <ZAxis
      data-key="z"
      :range="[60, 400]"
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
    <Scatter
      name="Series A"
      :data="data01"
      fill="#f97316"
    />
    <Scatter
      name="Series B"
      :data="data02"
      fill="#14b8a6"
    />
  </ScatterChart>
</template>
