<script setup lang="ts">
import { Monitor, Smartphone, TrendingUp } from 'lucide-vue-next'
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart, Tooltip } from 'vccs'
import type { ChartConfig } from '~/components/ui/chart/types'
import ChartTooltipContent from '~/components/ui/chart/ChartTooltipContent.vue'

const chartData = [{ month: 'january', desktop: 1260, mobile: 570 }]

const chartConfig: ChartConfig = {
  desktop: { label: 'Desktop', color: 'var(--chart-1)', icon: Monitor },
  mobile: { label: 'Mobile', color: 'var(--chart-2)', icon: Smartphone },
}

const totalVisitors = chartData[0]?.desktop! + chartData[0]?.mobile!
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>Radial Chart - Stacked</CardTitle>
      <CardDescription>January - June 2024</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-1 items-center pb-0">
      <ChartContainer
        :config="chartConfig"
        class="mx-auto aspect-square w-full max-w-[250px]"
      >
        <RadialBarChart
          :data="chartData"
          :end-angle="180"
          :inner-radius="80"
          :outer-radius="130"
        >
          <Tooltip :cursor="false">
            <template #content="{ active, payload, label }">
              <ChartTooltipContent
                :active="active"
                :payload="payload"
                :label="label"
                hide-label
              />
            </template>
          </Tooltip>
          <PolarRadiusAxis
            :tick="false"
            :tick-line="false"
            :axis-line="false"
          >
            <Label>
              <template #content="{ viewBox }">
                <text
                  v-if="viewBox && 'cx' in viewBox"
                  :x="viewBox.cx"
                  :y="viewBox.cy"
                  text-anchor="middle"
                  dominant-baseline="middle"
                >
                  <tspan
                    :x="viewBox.cx"
                    :y="(viewBox.cy || 0) - 16"
                    class="fill-foreground text-2xl font-bold"
                  >
                    {{ totalVisitors.toLocaleString() }}
                  </tspan>
                  <tspan
                    :x="viewBox.cx"
                    :y="(viewBox.cy || 0) + 4"
                    class="fill-muted-foreground"
                  >
                    Visitors
                  </tspan>
                </text>
              </template>
            </Label>
          </PolarRadiusAxis>

          <RadialBar
            data-key="desktop"
            stack-id="a"
            fill="var(--color-desktop)"
            :corner-radius="5"
            stroke="transparent"
            :stroke-width="2"
          />
          <RadialBar
            data-key="mobile"
            stack-id="a"
            fill="var(--color-mobile)"
            :corner-radius="5"
            stroke="transparent"
            :stroke-width="2"
          />
        </RadialBarChart>
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
