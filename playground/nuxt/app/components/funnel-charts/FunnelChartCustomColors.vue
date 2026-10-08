<script setup lang="ts">
import { TrendingDown } from 'lucide-vue-next'
import { Cell, Funnel, FunnelChart, Tooltip } from 'vccs'
import type { ChartConfig } from '~/components/ui/chart/types'
import ChartTooltipContent from '~/components/ui/chart/ChartTooltipContent.vue'

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c']

const chartData = [
  { stage: 'Awareness', value: 5000 },
  { stage: 'Interest', value: 3200 },
  { stage: 'Consideration', value: 1800 },
  { stage: 'Intent', value: 900 },
  { stage: 'Purchase', value: 400 },
]

const chartConfig: ChartConfig = {
  value: { label: 'Users' },
}
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>Funnel Chart - Custom Colors</CardTitle>
      <CardDescription>Marketing funnel with Cell overrides</CardDescription>
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
              :key="entry.stage"
              :fill="COLORS[index]"
            />
          </Funnel>
        </FunnelChart>
      </ChartContainer>
    </CardContent>
    <CardFooter class="flex-col gap-2 text-sm">
      <div class="flex items-center gap-2 font-medium leading-none">
        92% drop-off from awareness to purchase
        <TrendingDown class="size-4" />
      </div>
      <div class="leading-none text-muted-foreground">
        Marketing funnel analysis
      </div>
    </CardFooter>
  </Card>
</template>
