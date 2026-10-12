<script setup>
import { CartesianGrid, Line, LineChart, ReferenceDot, Tooltip, XAxis, YAxis } from 'vccs'

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
    <ReferenceDot
      x="Mar"
      :y="600"
      :r="8"
      fill="#f97316"
      stroke="#fff"
      :stroke-width="2"
      label="Peak"
    />
  </LineChart>
</template>
