<script setup>
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'vccs'
import DataMarker from './DataMarker.vue'

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
    :margin="{ top: 30, right: 30, left: 20, bottom: 5 }"
    :height="300"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis data-key="name" />
    <YAxis />
    <Line
      type="monotone"
      data-key="value"
      stroke="#f97316"
    />
    <DataMarker
      x="Mar"
      :y="600"
      label="Peak"
    />
  </LineChart>
</template>
