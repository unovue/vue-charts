<script setup>
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Jan', desktop: 186, mobile: 80 },
  { name: 'Feb', desktop: 305, mobile: 200 },
  { name: 'Mar', desktop: 237, mobile: 120 },
  { name: 'Apr', desktop: 73, mobile: 190 },
  { name: 'May', desktop: 209, mobile: 130 },
  { name: 'Jun', desktop: 214, mobile: 140 },
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
    <Line
      type="monotone"
      data-key="mobile"
      stroke="#14b8a6"
    />
  </LineChart>
</template>
