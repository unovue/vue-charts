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
      { name: 'DragControl', value: 2649 },
      { name: 'ExpandControl', value: 2832 },
    ],
  },
  {
    name: 'data',
    children: [
      { name: 'Data', value: 20544 },
      { name: 'DataList', value: 19788 },
      { name: 'DataSprite', value: 10349 },
      { name: 'EdgeSprite', value: 3301 },
      { name: 'NodeSprite', value: 19382 },
    ],
  },
  {
    name: 'events',
    children: [
      { name: 'DataEvent', value: 7313 },
      { name: 'SelectionEvent', value: 6880 },
      { name: 'TooltipEvent', value: 3701 },
      { name: 'VisualizationEvent', value: 2117 },
    ],
  },
]

const colors = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>Nest Mode</CardTitle>
      <CardDescription>Click a group to drill down</CardDescription>
    </CardHeader>
    <CardContent class="flex-1 pb-0">
      <Treemap
        :height="250"
        :data="chartData"
        data-key="value"
        type="nest"
        :color-panel="colors"
        stroke="#fff"
        :is-animation-active="true"
      />
    </CardContent>
  </Card>
</template>
