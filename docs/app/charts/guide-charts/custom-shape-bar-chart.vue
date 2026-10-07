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

function getPath(x, y, width, height) {
  return `M${x},${y + height}C${x + width / 3},${y + height} ${x + width / 2},${y + height / 3} ${x + width / 2},${y}C${x + width / 2},${y + height / 3} ${x + (2 * width) / 3},${y + height} ${x + width},${y + height}Z`
}
</script>

<template>
  <BarChart
    :data="data"
    :margin="{ top: 5, right: 20, left: 10, bottom: 20 }"
    :height="300"
  >
    <XAxis data-key="name" />
    <YAxis />
    <Bar
      data-key="uv"
      fill="#8884d8"
    >
      <template #shape="props">
        <path
          :d="getPath(props.x, props.y, props.width, props.height)"
          stroke="none"
          :fill="props.fill"
        />
      </template>
    </Bar>
  </BarChart>
</template>
