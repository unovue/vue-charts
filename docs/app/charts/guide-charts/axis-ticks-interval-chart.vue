<script setup>
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Page A', uv: 590 },
  { name: 'Page B', uv: 590 },
  { name: 'Page C', uv: 868 },
  { name: 'Page D', uv: 1397 },
  { name: 'Page E', uv: 1480 },
  { name: 'Page F', uv: 1520 },
  { name: 'Page G', uv: 1400 },
  { name: 'Page H', uv: 900 },
  { name: 'Page I', uv: 750 },
  { name: 'Page J', uv: 620 },
  { name: 'Page K', uv: 450 },
  { name: 'Page L', uv: 380 },
]
</script>

<template>
  <BarChart
    :data="data"
    :height="400"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis
      data-key="name"
      :interval="0"
      :angle="-45"
      :height="60"
    />
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
    <Bar
      data-key="uv"
      fill="#8884d8"
    />
  </BarChart>
</template>
