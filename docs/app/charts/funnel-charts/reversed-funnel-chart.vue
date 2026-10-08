<script setup>
import { Cell, Funnel, FunnelChart, Tooltip } from 'vccs'

const data = [
  { name: 'Tier 1', value: 500 },
  { name: 'Tier 2', value: 380 },
  { name: 'Tier 3', value: 250 },
  { name: 'Tier 4', value: 120 },
]

const COLORS = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
</script>

<template>
  <FunnelChart :height="300">
    <Tooltip :cursor="false">
      <template #content="{ active, payload, label }">
        <ChartTooltipContent
          :active="active"
          :payload="payload"
          :label="label"
        />
      </template>
    </Tooltip>
    <Funnel
      :data="data"
      data-key="value"
      name-key="name"
      :reversed="true"
    >
      <Cell
        v-for="(entry, index) in data"
        :key="index"
        :fill="COLORS[index]"
      />
    </Funnel>
  </FunnelChart>
</template>
