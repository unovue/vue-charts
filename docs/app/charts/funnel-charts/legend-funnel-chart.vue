<script setup>
import { Funnel, FunnelChart, Legend, Tooltip } from 'vccs'

const data = [
  { name: 'Impressions', value: 12000, fill: '#f97316' },
  { name: 'Clicks', value: 4800, fill: '#14b8a6' },
  { name: 'Signups', value: 1500, fill: '#f59e0b' },
  { name: 'Active', value: 680, fill: '#06b6d4' },
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
    />
    <Legend />
  </FunnelChart>
</template>
