<script setup>
import { Bar, BarChart, CartesianGrid, Rectangle, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { month: 'Jan', desktop: 186 },
  { month: 'Feb', desktop: 305 },
  { month: 'Mar', desktop: 237 },
  { month: 'Apr', desktop: 173 },
  { month: 'May', desktop: 209 },
  { month: 'Jun', desktop: 264 },
]
</script>

<template>
  <BarChart
    :data="data"
    :height="300"
  >
    <CartesianGrid
      stroke-dasharray="3 3"
      :vertical="false"
    />
    <XAxis data-key="month" />
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
      data-key="desktop"
      fill="#f97316"
    >
      <template #shape="{ x, y, width, height, fill }">
        <Rectangle
          :x="x"
          :y="y"
          :width="width"
          :height="height"
          :radius="[6, 6, 0, 0]"
          :fill="fill"
        />
      </template>
      <template #activeBar="{ x, y, width, height }">
        <Rectangle
          :x="x"
          :y="y"
          :width="width"
          :height="height"
          :radius="[6, 6, 0, 0]"
          fill="#f59e0b"
          stroke="#f97316"
          :stroke-width="2"
        />
      </template>
    </Bar>
  </BarChart>
</template>
