<script setup lang="ts">
import { Bar, BarChart, Legend, Tooltip, XAxis, YAxis } from 'vccs'
import type { BarRow } from '../datasets'

defineProps<{ data: BarRow[], dark: boolean }>()

const darkTokens = { '--v-charts-text': '#a1a1aa', '--v-charts-axis': '#52525b', '--v-charts-cursor': '#52525b' }
</script>

<template>
  <div :style="dark ? darkTokens : undefined">
    <BarChart
      :data="data"
      :height="300"
    >
      <XAxis data-key="segment" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar
        data-key="desktop"
        name="Desktop"
        stack-id="visitors"
      />
      <Bar
        data-key="mobile"
        name="Mobile"
        stack-id="visitors"
      />
      <Bar
        data-key="tablet"
        name="Tablet"
        stack-id="visitors"
      />
    </BarChart>
  </div>
</template>
