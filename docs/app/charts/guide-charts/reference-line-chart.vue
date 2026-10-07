<script setup>
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from 'vccs'

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
  <LineChart
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
    <ReferenceArea
      x1="Page B"
      x2="Page D"
      fill="#8884d8"
      :fill-opacity="0.1"
    />
    <ReferenceLine
      :y="1200"
      stroke="red"
      stroke-dasharray="3 3"
    />
    <Line
      type="monotone"
      data-key="uv"
      stroke="#8884d8"
    />
    <Line
      type="monotone"
      data-key="pv"
      stroke="#82ca9d"
    />
  </LineChart>
</template>
