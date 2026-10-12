<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next'
import { Funnel, FunnelChart, Tooltip } from 'vccs'
import type { ChartConfig } from '~/components/ui/chart/types'
import ChartTooltipContent from '~/components/ui/chart/ChartTooltipContent.vue'

const chartData = [
  { stage: 'Tier 1', value: 500, fill: 'var(--color-tier1)' },
  { stage: 'Tier 2', value: 380, fill: 'var(--color-tier2)' },
  { stage: 'Tier 3', value: 250, fill: 'var(--color-tier3)' },
  { stage: 'Tier 4', value: 120, fill: 'var(--color-tier4)' },
]

const chartConfig: ChartConfig = {
  value: { label: 'Users' },
  tier1: { label: 'Tier 1', color: 'var(--chart-1)' },
  tier2: { label: 'Tier 2', color: 'var(--chart-2)' },
  tier3: { label: 'Tier 3', color: 'var(--chart-3)' },
  tier4: { label: 'Tier 4', color: 'var(--chart-4)' },
}
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>Funnel Chart - Reversed</CardTitle>
      <CardDescription>Inverted pyramid view</CardDescription>
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
            :reversed="true"
          />
        </FunnelChart>
      </ChartContainer>
    </CardContent>
    <CardFooter class="flex-col gap-2 text-sm">
      <div class="flex items-center gap-2 font-medium leading-none">
        Reversed funnel layout
        <TrendingUp class="size-4" />
      </div>
      <div class="leading-none text-muted-foreground">
        Narrowest at top, widest at bottom
      </div>
    </CardFooter>
  </Card>
</template>
