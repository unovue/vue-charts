<script setup lang="ts">
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip } from 'vccs'
import type { RadarRow } from '../datasets'

defineProps<{ data: RadarRow[], dark: boolean }>()

const darkTokens = { '--v-charts-text': '#a1a1aa', '--v-charts-axis': '#52525b', '--v-charts-cursor': '#52525b' }
</script>

<template>
  <div :style="dark ? darkTokens : undefined">
    <RadarChart
      :data="data"
      :height="300"
    >
      <PolarGrid />
      <PolarAngleAxis data-key="subject" />
      <Tooltip />
      <Legend />
      <Radar
        data-key="desktop"
        name="Desktop"
        :fill-opacity="0.4"
      />
      <Radar
        data-key="mobile"
        name="Mobile"
        :fill-opacity="0.4"
      />
    </RadarChart>
  </div>
</template>
