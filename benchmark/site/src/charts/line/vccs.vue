<script setup lang="ts">
import { Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'vccs'
import type { LineRow } from './data'

defineProps<{ data: LineRow[], dark: boolean }>()

const darkTokens = { '--v-charts-text': '#a1a1aa', '--v-charts-axis': '#52525b', '--v-charts-cursor': '#52525b' }
</script>

<template>
  <div :style="dark ? darkTokens : undefined">
    <LineChart
      :data="data"
      :height="300"
    >
      <XAxis data-key="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line
        type="monotone"
        data-key="desktop"
        name="Desktop"
        :dot="false"
      />
      <Line
        type="monotone"
        data-key="mobile"
        name="Mobile"
        :dot="false"
      />
      <Line
        type="monotone"
        data-key="tablet"
        name="Tablet"
        :dot="false"
      />
    </LineChart>
  </div>
</template>
