<script setup>
import { Cell, Funnel, FunnelChart, Tooltip } from 'vccs'

const data = [
  { name: 'Visit', value: 1000 },
  { name: 'Cart', value: 680 },
  { name: 'Checkout', value: 420 },
  { name: 'Purchase', value: 260 },
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
    >
      <Cell
        v-for="(entry, index) in data"
        :key="index"
        :fill="COLORS[index]"
      />
    </Funnel>
  </FunnelChart>
</template>
