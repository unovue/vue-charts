<script setup lang="ts">
import { Funnel, FunnelChart, Tooltip } from 'vccs'
import type { ChartConfig } from '~/components/ui/chart/types'
import ChartTooltipContent from '~/components/ui/chart/ChartTooltipContent.vue'

const chartData = [
  { stage: 'Leads', value: 800, fill: 'var(--color-leads)' },
  { stage: 'Qualified', value: 540, fill: 'var(--color-qualified)' },
  { stage: 'Proposal', value: 320, fill: 'var(--color-proposal)' },
  { stage: 'Closed', value: 180, fill: 'var(--color-closed)' },
]

const chartConfig: ChartConfig = {
  value: { label: 'Count' },
  leads: { label: 'Leads', color: 'var(--chart-1)' },
  qualified: { label: 'Qualified', color: 'var(--chart-2)' },
  proposal: { label: 'Proposal', color: 'var(--chart-3)' },
  closed: { label: 'Closed', color: 'var(--chart-4)' },
}
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>Funnel Chart - Rectangle</CardTitle>
      <CardDescription>Last segment as rectangle</CardDescription>
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
            last-shape-type="rectangle"
          />
        </FunnelChart>
      </ChartContainer>
    </CardContent>
  </Card>
</template>
