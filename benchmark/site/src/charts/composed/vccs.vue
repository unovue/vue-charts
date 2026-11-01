<script setup lang="ts">
import { Area, Bar, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from 'vccs'
import type { LineRow } from '../line/data'

defineProps<{ data: LineRow[], dark: boolean }>()

const darkTokens = { '--v-charts-text': '#a1a1aa', '--v-charts-axis': '#52525b', '--v-charts-cursor': '#52525b' }
</script>

<template>
  <div :style="dark ? darkTokens : undefined">
    <ComposedChart
      :data="data"
      :height="300"
    >
      <XAxis data-key="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar
        data-key="desktop"
        name="Desktop"
      />
      <Area
        type="monotone"
        data-key="tablet"
        name="Tablet"
      />
      <Line
        type="monotone"
        data-key="mobile"
        name="Mobile"
        :dot="false"
      />
    </ComposedChart>
  </div>
</template>
