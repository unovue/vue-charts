<script setup>
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Jan', desktop: 186 },
  { name: 'Feb', desktop: 305 },
  { name: 'Mar', desktop: 237 },
  { name: 'Apr', desktop: 73 },
  { name: 'May', desktop: 209 },
  { name: 'Jun', desktop: 214 },
]
</script>

<template>
  <LineChart
    :data="data"
    :height="300"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis data-key="name" />
    <YAxis />
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
      data-key="desktop"
      stroke="#f97316"
    />
  </LineChart>
</template>
