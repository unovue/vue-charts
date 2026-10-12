<script setup>
import { Bar, BarChart, CartesianGrid, LabelList, Tooltip, XAxis, YAxis } from 'vccs'

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
  <BarChart
    :data="data"
    :margin="{ top: 20 }"
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
    <Bar
      data-key="value"
      fill="#f97316"
    >
      <LabelList
        position="top"
        :offset="12"
        :font-size="12"
      />
    </Bar>
  </BarChart>
</template>
