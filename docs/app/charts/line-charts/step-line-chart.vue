<script setup>
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Jan', value: 186 },
  { name: 'Feb', value: 305 },
  { name: 'Mar', value: 237 },
  { name: 'Apr', value: 73 },
  { name: 'May', value: 209 },
  { name: 'Jun', value: 214 },
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
      type="step"
      data-key="value"
      stroke="#f97316"
    />
  </LineChart>
</template>
