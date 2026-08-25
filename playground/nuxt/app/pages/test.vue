<script setup lang="ts">
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'vccs'

// #region Sample data
const data = [
  {
    name: 'Page A',
    uv: 400,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 300,
    pv: 4567,
    amt: 2400,
  },
  {
    name: 'Page C',
    uv: 320,
    pv: 1398,
    amt: 2400,
  },
  {
    name: 'Page D',
    uv: 200,
    pv: 9800,
    amt: 2400,
  },
  {
    name: 'Page E',
    uv: 278,
    pv: 3908,
    amt: 2400,
  },
  {
    name: 'Page F',
    uv: 189,
    pv: 4800,
    amt: 2400,
  },
]
// #endregion
</script>

<template>
  <LineChart
    :style="{
      width: '100%',
      aspectRatio: 1.618,
      maxWidth: '600px',
    }"
    responsive
    :data="data"
    :margin="{
      top: 20,
      right: 20,
      bottom: 5,
      left: 0,
    }"
  >
    <CartesianGrid
      stroke="#aaa"
      stroke-dasharray="5 5"
    />
    <Line
      type="monotone"
      data-key="uv"
      stroke="purple"
      :stroke-width="2"
      name="My data series name"
    />
    <XAxis data-key="name" />
    <YAxis
      width="auto"
      :label="{ value: 'UV', position: 'insideLeft', angle: -90 }"
    />
    <Legend align="right" />
  </LineChart>
</template>
