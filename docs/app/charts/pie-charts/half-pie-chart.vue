<script setup>
import { Cell, Pie, PieChart, Tooltip } from 'vccs'

const data = [
  { name: 'A', value: 400 },
  { name: 'B', value: 300 },
  { name: 'C', value: 200 },
  { name: 'D', value: 150 },
  { name: 'E', value: 100 },
]

const COLORS = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4', '#ef4444']
</script>

<template>
  <PieChart :height="300">
    <Tooltip :cursor="false">
      <template #content="{ active, payload, label }">
        <ChartTooltipContent
          :active="active"
          :payload="payload"
          :label="label"
        />
      </template>
    </Tooltip>
    <Pie
      :data="data"
      data-key="value"
      name-key="name"
      cx="50%"
      cy="50%"
      :outer-radius="120"
      :start-angle="180"
      :end-angle="0"
      fill="#f97316"
    >
      <Cell
        v-for="(entry, index) in data"
        :key="index"
        :fill="COLORS[index]"
      />
    </Pie>
  </PieChart>
</template>
