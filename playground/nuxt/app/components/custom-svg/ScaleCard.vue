<script setup lang="ts">
import { Layers } from 'lucide-vue-next'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'vccs'
import AverageLine from './AverageLine.vue'
import type { ChartConfig } from '~/components/ui/chart/types'
import ChartTooltipContent from '~/components/ui/chart/ChartTooltipContent.vue'

const chartData = [
  { month: 'Jan', desktop: 186, mobile: 80 },
  { month: 'Feb', desktop: 305, mobile: 200 },
  { month: 'Mar', desktop: 237, mobile: 120 },
  { month: 'Apr', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'Jun', desktop: 354, mobile: 140 },
]

const average = Math.round(chartData.reduce((sum, row) => sum + row.desktop, 0) / chartData.length)

const chartConfig: ChartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'var(--chart-1)',
  },
  mobile: {
    label: 'Mobile',
    color: 'var(--chart-2)',
  },
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Custom SVG - Axis scale</CardTitle>
      <CardDescription>
        Draw a reference line with useYAxisScale()
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ChartContainer
        :config="chartConfig"
        class="aspect-auto h-[250px] w-full"
      >
        <BarChart
          :data="chartData"
          :margin="{ left: 12, right: 48, top: 20 }"
        >
          <CartesianGrid :vertical="false" />
          <XAxis
            data-key="month"
            :tick-line="false"
            :axis-line="false"
            :tick-margin="8"
          />
          <YAxis
            :tick-line="false"
            :axis-line="false"
          />
          <Tooltip :cursor="false">
            <template #content="{ active, payload, label }">
              <ChartTooltipContent
                :active="active"
                :payload="payload"
                :label="label"
              />
            </template>
          </Tooltip>
          <Bar
            data-key="desktop"
            fill="var(--color-desktop)"
            :radius="4"
            :is-animation-active="false"
          />
          <Bar
            data-key="mobile"
            fill="var(--color-mobile)"
            :radius="4"
            :is-animation-active="false"
          />
          <AverageLine
            :value="average"
            :label="`avg ${average}`"
          />
        </BarChart>
      </ChartContainer>
    </CardContent>
    <CardFooter>
      <div class="flex w-full items-start gap-2 text-sm">
        <div class="grid gap-2">
          <div class="flex items-center gap-2 font-medium leading-none">
            Average line from the y scale
            <Layers class="size-4" />
          </div>
          <div class="flex items-center gap-2 leading-none text-muted-foreground">
            January - June 2024
          </div>
        </div>
      </div>
    </CardFooter>
  </Card>
</template>
