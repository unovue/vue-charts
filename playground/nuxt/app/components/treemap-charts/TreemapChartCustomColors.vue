<script setup lang="ts">
import { Treemap } from 'vccs'

const chartData = [
  {
    name: 'axis',
    children: [
      { name: 'Axes', value: 1302 },
      { name: 'Axis', value: 24593 },
      { name: 'AxisGridLine', value: 652 },
      { name: 'AxisLabel', value: 636 },
    ],
  },
  {
    name: 'controls',
    children: [
      { name: 'AnchorControl', value: 2138 },
      { name: 'ClickControl', value: 3824 },
      { name: 'Control', value: 1353 },
      { name: 'ControlList', value: 4665 },
    ],
  },
  {
    name: 'data',
    children: [
      { name: 'Data', value: 20544 },
      { name: 'DataList', value: 19788 },
      { name: 'NodeSprite', value: 19382 },
    ],
  },
  {
    name: 'events',
    children: [
      { name: 'DataEvent', value: 7313 },
      { name: 'SelectionEvent', value: 6880 },
    ],
  },
]

const colors = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>Custom Colors</CardTitle>
      <CardDescription>Using colors prop</CardDescription>
    </CardHeader>
    <CardContent class="flex-1 pb-0">
      <Treemap
        :height="250"
        :data="chartData"
        data-key="value"
        :colors="colors"
        stroke="#fff"
      />
    </CardContent>
  </Card>
</template>
