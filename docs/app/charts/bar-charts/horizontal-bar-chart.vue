<script setup>
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Page A', value: 4000 },
  { name: 'Page B', value: 3000 },
  { name: 'Page C', value: 2000 },
  { name: 'Page D', value: 2780 },
  { name: 'Page E', value: 1890 },
]
</script>

<template>
  <BarChart
    :data="data"
    layout="vertical"
    :height="300"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis type="number" />
    <YAxis
      data-key="name"
      type="category"
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
    <Bar
      data-key="value"
      fill="#f97316"
    />
  </BarChart>
</template>
