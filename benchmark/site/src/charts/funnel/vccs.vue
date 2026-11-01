<script setup lang="ts">
import { Cell, Funnel, FunnelChart, LabelList, Tooltip } from 'vccs'
import type { ShareRow } from '../datasets'

defineProps<{ data: ShareRow[], dark: boolean }>()

const darkTokens = { '--v-charts-text': '#a1a1aa', '--v-charts-axis': '#52525b', '--v-charts-cursor': '#52525b' }
const colors = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
</script>

<template>
  <div :style="dark ? darkTokens : undefined">
    <FunnelChart :height="300">
      <Tooltip />
      <Funnel
        :data="data"
        data-key="value"
        name-key="name"
      >
        <LabelList
          position="center"
          data-key="name"
          fill="#fff"
        />
        <Cell
          v-for="(entry, index) in data"
          :key="entry.name"
          :fill="colors[index]"
        />
      </Funnel>
    </FunnelChart>
  </div>
</template>
