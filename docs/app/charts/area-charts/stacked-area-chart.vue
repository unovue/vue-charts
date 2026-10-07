<script setup>
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Jan', desktop: 400, mobile: 240 },
  { name: 'Feb', desktop: 300, mobile: 139 },
  { name: 'Mar', desktop: 200, mobile: 980 },
  { name: 'Apr', desktop: 278, mobile: 390 },
  { name: 'May', desktop: 189, mobile: 480 },
  { name: 'Jun', desktop: 239, mobile: 380 },
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
    <Area
      type="monotone"
      data-key="desktop"
      stack-id="a"
      stroke="#f97316"
      fill="#f97316"
    />
    <Area
      type="monotone"
      data-key="mobile"
      stack-id="a"
      stroke="#14b8a6"
      fill="#14b8a6"
    />
  </AreaChart>
</template>
