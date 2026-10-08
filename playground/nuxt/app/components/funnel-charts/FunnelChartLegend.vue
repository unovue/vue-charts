<script setup lang="ts">
import { Cell, Funnel, FunnelChart, Legend, Tooltip } from 'vccs'
import type { ChartConfig } from '~/components/ui/chart/types'
import ChartTooltipContent from '~/components/ui/chart/ChartTooltipContent.vue'
import ChartLegendContent from '~/components/ui/chart/ChartLegendContent.vue'

const chartData = [
  { stage: 'Impressions', value: 12000 },
  { stage: 'Clicks', value: 4800 },
  { stage: 'Signups', value: 1500 },
  { stage: 'Active', value: 680 },
]

const COLORS = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']

const chartConfig: ChartConfig = {
  value: { label: 'Count' },
  impressions: { label: 'Impressions', color: '#f97316' },
  clicks: { label: 'Clicks', color: '#14b8a6' },
  signups: { label: 'Signups', color: '#f59e0b' },
  active: { label: 'Active', color: '#06b6d4' },
}
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>Funnel Chart - Legend</CardTitle>
      <CardDescription>With legend component</CardDescription>
    </CardHeader>
    <CardContent class="flex-1 pb-0">
      <ChartContainer
        :config="chartConfig"
        class="mx-auto aspect-square max-h-[300px]"
      >
        <FunnelChart>
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
            :data="chartData"
            data-key="value"
            name-key="stage"
          >
            <Cell
              v-for="(entry, index) in chartData"
              :key="index"
              :fill="COLORS[index]"
            />
          </Funnel>
          <Legend>
            <template #content="legendProps">
              <ChartLegendContent
                v-bind="legendProps"
                name-key="stage"
              />
            </template>
          </Legend>
        </FunnelChart>
      </ChartContainer>
    </CardContent>
  </Card>
</template>
