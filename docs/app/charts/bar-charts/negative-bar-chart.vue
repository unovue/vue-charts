<script setup>
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: -300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: -200 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: -150 },
]
</script>

<template>
  <BarChart
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
    <Bar data-key="value">
      <Cell
        v-for="(item, index) in data"
        :key="index"
        :fill="item.value > 0 ? '#f97316' : '#f87171'"
      />
    </Bar>
  </BarChart>
</template>
