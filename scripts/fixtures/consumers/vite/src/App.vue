<script setup lang="ts">
import RegistryChart from './RegistryChart.vue'
import { Bar, BarChart, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'vccs'

const data = [{ name: 'A', value: 12 }, { name: 'B', value: 24 }]
</script>

<template>
  <RegistryChart />
  <BarChart
    :width="600"
    :height="300"
    :data="data"
  >
    <Bar
      data-key="value"
      :is-animation-active="false"
    />
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis data-key="name" />
    <YAxis />
    <Tooltip>
      <template #content="{ active, payload, label }">
        <div v-if="active">
          {{ label }}: {{ payload.map(item => item.value).join(', ') }}
        </div>
      </template>
      <template #cursor="{ width, height }">
        <rect
          :width="width"
          :height="height"
        />
      </template>
    </Tooltip>
    <Legend />
  </BarChart>
  <LineChart
    :width="600"
    :height="300"
    :data="data"
  >
    <Line
      data-key="value"
      :is-animation-active="false"
    />
    <Tooltip />
    <Legend />
  </LineChart>
</template>
