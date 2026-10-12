<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next'
import { Pie, PieChart, Sector, Tooltip } from 'vccs'
import type { ChartConfig } from '~/components/ui/chart/types'
import ChartTooltipContent from '~/components/ui/chart/ChartTooltipContent.vue'

const chartData = [
  { browser: 'Chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'Safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'Firefox', visitors: 187, fill: 'var(--color-firefox)' },
  { browser: 'Edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'Other', visitors: 90, fill: 'var(--color-other)' },
]

const chartConfig: ChartConfig = {
  visitors: { label: 'Visitors' },
  chrome: { label: 'Chrome', color: 'var(--chart-1)' },
  safari: { label: 'Safari', color: 'var(--chart-2)' },
  firefox: { label: 'Firefox', color: 'var(--chart-3)' },
  edge: { label: 'Edge', color: 'var(--chart-4)' },
  other: { label: 'Other', color: 'var(--chart-5)' },
}

function labelPos(cx: number, cy: number, outerRadius: number, midAngle: number) {
  const RADIAN = Math.PI / 180
  const radius = outerRadius * 0.65
  return {
    // Rounded: server and browser can differ in the last digit of cos/sin, which breaks hydration.
    x: Math.round((cx + radius * Math.cos(-midAngle * RADIAN)) * 100) / 100,
    y: Math.round((cy + radius * Math.sin(-midAngle * RADIAN)) * 100) / 100,
  }
}
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>Pie Chart - Custom Label</CardTitle>
      <CardDescription>January - June 2024</CardDescription>
    </CardHeader>
    <CardContent class="flex-1 pb-0">
      <ChartContainer
        :config="chartConfig"
        class="mx-auto aspect-square max-h-[250px]"
      >
        <PieChart>
          <Tooltip>
            <template #content="{ active, payload, label }">
              <ChartTooltipContent
                :active="active"
                :payload="payload"
                :label="label"
                hide-label
              />
            </template>
          </Tooltip>
          <Pie
            :data="chartData"
            data-key="visitors"
            name-key="browser"
          >
            <template #shape="sp">
              <Sector
                :cx="sp.cx"
                :cy="sp.cy"
                :inner-radius="sp.innerRadius"
                :outer-radius="sp.outerRadius"
                :start-angle="sp.startAngle"
                :end-angle="sp.endAngle"
                :fill="sp.fill"
                :stroke="sp.stroke"
              />
              <text
                :x="labelPos(sp.cx, sp.cy, sp.outerRadius, sp.midAngle).x"
                :y="labelPos(sp.cx, sp.cy, sp.outerRadius, sp.midAngle).y"
                text-anchor="middle"
                dominant-baseline="central"
                class="fill-foreground"
                style="font-size: 12px;"
              >
                {{ sp.value }}
              </text>
            </template>
          </Pie>
        </PieChart>
      </ChartContainer>
    </CardContent>
    <CardFooter class="flex-col gap-2 text-sm">
      <div class="flex items-center gap-2 font-medium leading-none">
        Trending up by 5.2% this month
        <TrendingUp class="size-4" />
      </div>
      <div class="leading-none text-muted-foreground">
        Showing total visitors for the last 6 months
      </div>
    </CardFooter>
  </Card>
</template>
