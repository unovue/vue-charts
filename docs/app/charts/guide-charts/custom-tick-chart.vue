<script setup>
import { Bar, BarChart, XAxis, YAxis } from 'vccs'

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
    :margin="{ top: 20, right: 20, left: 10, bottom: 20 }"
    :height="300"
  >
    <XAxis data-key="name">
      <template #tick="{ x, y, payload }">
        <g :transform="`translate(${x},${y})`">
          <text
            :x="0"
            :y="0"
            dy="16"
            text-anchor="end"
            fill="#666"
            transform="rotate(-35)"
          >
            {{ payload.value }}
          </text>
        </g>
      </template>
    </XAxis>
    <YAxis />
    <Bar
      data-key="uv"
      :bar-size="30"
      fill="#8884d8"
    />
  </BarChart>
</template>
