<script setup>
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 700 },
]
</script>

<template>
  <AreaChart
    :data="data"
    :height="300"
  >
    <defs>
      <linearGradient
        id="colorValue"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop
          offset="5%"
          stop-color="#f97316"
          stop-opacity="0.8"
        />
        <stop
          offset="95%"
          stop-color="#f97316"
          stop-opacity="0"
        />
      </linearGradient>
    </defs>
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
      data-key="value"
      stroke="#f97316"
      fill="url(#colorValue)"
    />
  </AreaChart>
</template>
