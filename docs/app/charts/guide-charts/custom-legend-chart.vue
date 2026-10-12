<script setup>
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Page A', uv: 590, pv: 800, amt: 1400 },
  { name: 'Page B', uv: 590, pv: 800, amt: 1400 },
  { name: 'Page C', uv: 868, pv: 967, amt: 1506 },
  { name: 'Page D', uv: 1397, pv: 1098, amt: 989 },
  { name: 'Page E', uv: 1480, pv: 1200, amt: 1228 },
  { name: 'Page F', uv: 1520, pv: 1108, amt: 1100 },
  { name: 'Page G', uv: 1400, pv: 680, amt: 1700 },
]
</script>

<template>
  <BarChart
    :data="data"
    :margin="{ top: 5, right: 20, left: 10, bottom: 5 }"
    :height="300"
  >
    <XAxis
      data-key="name"
      stroke="#8884d8"
    />
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
    <Legend
      :width="100"
      :wrapper-style="{
        top: '40px',
        right: '20px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #d5d5d5',
        borderRadius: '3px',
        lineHeight: '40px',
      }"
    />
    <CartesianGrid
      stroke="#ccc"
      stroke-dasharray="5 5"
    />
    <Bar
      data-key="uv"
      fill="#8884d8"
      :bar-size="30"
    />
  </BarChart>
</template>
