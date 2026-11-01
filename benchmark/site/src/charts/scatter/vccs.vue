<script setup lang="ts">
import { computed } from 'vue'
import { Legend, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'vccs'
import type { ScatterRow } from '../datasets'

const props = defineProps<{ data: ScatterRow[], dark: boolean }>()

const darkTokens = { '--v-charts-text': '#a1a1aa', '--v-charts-axis': '#52525b', '--v-charts-cursor': '#52525b' }
const desktop = computed(() => props.data.filter(row => row.group === 'Desktop'))
const mobile = computed(() => props.data.filter(row => row.group === 'Mobile'))
</script>

<template>
  <div :style="dark ? darkTokens : undefined">
    <ScatterChart :height="300">
      <XAxis
        data-key="x"
        type="number"
      />
      <YAxis
        data-key="y"
        type="number"
      />
      <Tooltip />
      <Legend />
      <Scatter
        name="Desktop"
        :data="desktop"
      />
      <Scatter
        name="Mobile"
        :data="mobile"
      />
    </ScatterChart>
  </div>
</template>
