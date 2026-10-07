<script setup>
import { Area, AreaChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Jan', desktop: 400, mobile: 240 },
  { name: 'Feb', desktop: 300, mobile: 139 },
  { name: 'Mar', desktop: 600, mobile: 980 },
  { name: 'Apr', desktop: 800, mobile: 390 },
  { name: 'May', desktop: 500, mobile: 480 },
  { name: 'Jun', desktop: 700, mobile: 380 },
]
</script>

<template>
  <AreaChart
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
    <Legend />
    <Area
      type="monotone"
      data-key="desktop"
      stroke="#f97316"
      fill="#f97316"
      :fill-opacity="0.3"
    />
    <Area
      type="monotone"
      data-key="mobile"
      stroke="#14b8a6"
      fill="#14b8a6"
      :fill-opacity="0.3"
    />
  </AreaChart>
</template>
