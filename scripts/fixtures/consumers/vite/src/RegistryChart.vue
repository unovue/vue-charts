<script setup lang="ts">
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, defineChartComponents } from 'vccs'
import ChartContainer from './ChartContainer.vue'

interface Row { month: string, visitors: number }
const Chart = defineChartComponents<Row>()({ AreaChart, Area, XAxis, Tooltip })
const rows: Row[] = [{ month: 'January', visitors: 12 }]
</script>

<template>
  <ChartContainer>
    <Chart.AreaChart
      :data="rows"
      :width="600"
      :height="300"
    >
      <CartesianGrid />
      <Chart.XAxis data-key="month" />
      <Chart.Area
        data-key="visitors"
        :is-animation-active="false"
      />
      <Chart.Tooltip>
        <template #content="{ active, payload, label }">
          <div v-if="active">
            {{ label }}: {{ payload.map(item => item.payload.visitors).join(', ') }}
          </div>
        </template>
      </Chart.Tooltip>
    </Chart.AreaChart>
  </ChartContainer>
</template>
