<script setup lang="ts">
import { TrendingDown } from 'lucide-vue-next'
import { Funnel, FunnelChart, Tooltip } from 'vccs'
import type { ChartConfig } from '~/components/ui/chart/types'
import ChartTooltipContent from '~/components/ui/chart/ChartTooltipContent.vue'

const chartData = [
  { stage: 'Visit', value: 1000, fill: 'var(--color-visit)' },
  { stage: 'Cart', value: 680, fill: 'var(--color-cart)' },
  { stage: 'Checkout', value: 420, fill: 'var(--color-checkout)' },
  { stage: 'Purchase', value: 260, fill: 'var(--color-purchase)' },
]

const chartConfig: ChartConfig = {
  value: { label: 'Users' },
  visit: { label: 'Visit', color: 'var(--chart-1)' },
  cart: { label: 'Cart', color: 'var(--chart-2)' },
  checkout: { label: 'Checkout', color: 'var(--chart-3)' },
  purchase: { label: 'Purchase', color: 'var(--chart-4)' },
}
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>Funnel Chart</CardTitle>
      <CardDescription>Conversion funnel</CardDescription>
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
          />
        </FunnelChart>
      </ChartContainer>
    </CardContent>
    <CardFooter class="flex-col gap-2 text-sm">
      <div class="flex items-center gap-2 font-medium leading-none">
        74% drop-off rate
        <TrendingDown class="size-4" />
      </div>
      <div class="leading-none text-muted-foreground">
        Showing conversion funnel for last 30 days
      </div>
    </CardFooter>
  </Card>
</template>
