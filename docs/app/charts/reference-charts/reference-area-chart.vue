<script setup>
import { CartesianGrid, Line, LineChart, ReferenceArea, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 280 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 450 },
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
      data-key="value"
      stroke="#f97316"
    />
    <ReferenceArea
      x1="Feb"
      x2="Apr"
      fill="#14b8a6"
      :fill-opacity="0.15"
      stroke="#14b8a6"
      label="Target Zone"
    />
  </LineChart>
</template>
