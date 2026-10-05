<script setup lang="ts">
import { CartesianGrid, defineChartComponents } from 'vccs'
import ChartContainer from './ChartContainer.vue'

interface Row { month: string, visitors: number }
const { AreaChart, Area, XAxis, Tooltip } = defineChartComponents<Row>()
const rows: Row[] = [{ month: 'January', visitors: 12 }]
</script>

<template>
  <ChartContainer>
    <AreaChart
      :data="rows"
      :width="600"
      :height="300"
    >
      <CartesianGrid />
      <XAxis data-key="month" />
      <Area
        data-key="visitors"
        :is-animation-active="false"
      />
      <Tooltip>
        <template #content="{ active, payload, label }">
          <div v-if="active">
            {{ label }}: {{ payload.map(item => item.payload.visitors).join(', ') }}
          </div>
        </template>
      </Tooltip>
    </AreaChart>
  </ChartContainer>
</template>
