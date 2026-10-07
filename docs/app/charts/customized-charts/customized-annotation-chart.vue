<script setup>
import { CartesianGrid, Customized, Line, LineChart, XAxis, YAxis } from 'vccs'

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
    :margin="{ top: 20, right: 30, left: 20, bottom: 5 }"
    :height="300"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis data-key="name" />
    <YAxis />
    <Line
      type="monotone"
      data-key="value"
      stroke="#f97316"
      :dot="false"
    />
    <Customized>
      <template #default="{ offset }">
        <line
          :x1="offset.left"
          :x2="offset.left + 1000"
          :y1="offset.top"
          :y2="offset.top"
          stroke="#14b8a6"
          stroke-dasharray="4 4"
          stroke-width="1"
        />
        <text
          :x="offset.left + 4"
          :y="offset.top - 6"
          fill="#14b8a6"
          font-size="12"
        >
          Plot area top
        </text>
      </template>
    </Customized>
  </LineChart>
</template>
