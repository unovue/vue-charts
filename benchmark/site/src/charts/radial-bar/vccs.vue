<script setup lang="ts">
import { computed } from 'vue'
import { Legend, PolarRadiusAxis, RadialBar, RadialBarChart, Tooltip } from 'vccs'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

const darkTokens = { '--v-charts-text': '#a1a1aa', '--v-charts-axis': '#52525b', '--v-charts-cursor': '#52525b' }
const colors = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
const rows = computed(() => props.data.map((row, index) => ({ ...row, fill: colors[index] })))
</script>

<template>
  <div :style="dark ? darkTokens : undefined">
    <RadialBarChart
      :data="rows"
      :inner-radius="30"
      :outer-radius="110"
      :height="300"
    >
      <PolarRadiusAxis
        data-key="name"
        type="category"
        :tick="false"
        :axis-line="false"
      />
      <RadialBar
        data-key="value"
        name="Visitors"
        :background="true"
      />
      <Tooltip />
      <Legend />
    </RadialBarChart>
  </div>
</template>
