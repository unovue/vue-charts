<script setup>
import { Bar, BarChart, Cell, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Page A', uv: 590, pv: 800, amt: 1400 },
  { name: 'Page B', uv: 590, pv: 800, amt: 1400 },
  { name: 'Page C', uv: 868, pv: 967, amt: 1506 },
  { name: 'Page D', uv: 1397, pv: 1098, amt: 989 },
  { name: 'Page E', uv: 1480, pv: 1200, amt: 1228 },
  { name: 'Page F', uv: 1520, pv: 1108, amt: 1100 },
  { name: 'Page G', uv: 1400, pv: 680, amt: 1700 },
]

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658']
</script>

<template>
  <BarChart
    :data="data"
    :margin="{ top: 5, right: 20, left: 10, bottom: 5 }"
    :height="300"
  >
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
    <Bar data-key="uv">
      <Cell
        v-for="(entry, i) in data"
        :key="i"
        :fill="COLORS[i % COLORS.length]"
      />
    </Bar>
  </BarChart>
</template>
