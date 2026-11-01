<script setup lang="ts">
import { Area, AreaChart, Legend, Tooltip, XAxis, YAxis } from 'vccs'
import type { LineRow } from '../line/data'

defineProps<{ data: LineRow[], dark: boolean }>()

const darkTokens = { '--v-charts-text': '#a1a1aa', '--v-charts-axis': '#52525b', '--v-charts-cursor': '#52525b' }
</script>

<template>
  <div :style="dark ? darkTokens : undefined">
    <AreaChart
      :data="data"
      :height="300"
    >
      <XAxis data-key="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Area
        type="monotone"
        data-key="desktop"
        name="Desktop"
        stack-id="visitors"
      />
      <Area
        type="monotone"
        data-key="mobile"
        name="Mobile"
        stack-id="visitors"
      />
      <Area
        type="monotone"
        data-key="tablet"
        name="Tablet"
        stack-id="visitors"
      />
    </AreaChart>
  </div>
</template>
