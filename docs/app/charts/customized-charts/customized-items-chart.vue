<script setup>
import { Bar, BarChart, CartesianGrid, Customized, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'A', uv: 400, pv: 240 },
  { name: 'B', uv: 300, pv: 139 },
  { name: 'C', uv: 200, pv: 380 },
  { name: 'D', uv: 278, pv: 190 },
  { name: 'E', uv: 189, pv: 280 },
]
</script>

<template>
  <BarChart
    :data="data"
    :margin="{ top: 20, right: 30, left: 20, bottom: 5 }"
    :height="300"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis data-key="name" />
    <YAxis />
    <Bar
      data-key="uv"
      fill="#f97316"
      :is-animation-active="false"
    />
    <Bar
      data-key="pv"
      fill="#14b8a6"
      :is-animation-active="false"
    />
    <Customized>
      <template #default="{ formattedGraphicalItems, offset }">
        <text
          v-for="(item, i) in formattedGraphicalItems"
          :key="i"
          :x="offset.left + 4"
          :y="offset.top + 16 + i * 16"
          fill="#666"
          font-size="11"
        >
          {{ item.type }}[{{ item.dataKey }}]
        </text>
      </template>
    </Customized>
  </BarChart>
</template>
