<script setup>
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Small and medium businesses', customers: 420 },
  { name: 'Public sector', customers: 260 },
  { name: 'Independent software vendors', customers: 340 },
]
</script>

<template>
  <BarChart
    :data="data"
    :height="320"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis
      data-key="name"
      :interval="0"
      :tick="{ width: 76 }"
      :height="50"
    />
    <YAxis />
    <Tooltip :cursor="false" />
    <Bar
      data-key="customers"
      fill="#f97316"
    />
  </BarChart>
</template>
