<script setup>
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Jan', desktop: 400, mobile: 240 },
  { name: 'Feb', desktop: 300, mobile: 456 },
  { name: 'Mar', desktop: 600, mobile: 139 },
  { name: 'Apr', desktop: 280, mobile: 980 },
  { name: 'May', desktop: 500, mobile: 390 },
  { name: 'Jun', desktop: 450, mobile: 480 },
]
</script>

<template>
  <LineChart
    :style="{ width: '100%', height: '300px' }"
    responsive
    :data="data"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis data-key="name" />
    <YAxis />
    <Legend position="insideTopRight" />
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
