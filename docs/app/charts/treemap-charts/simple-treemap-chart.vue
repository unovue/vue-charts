<script setup>
import { Tooltip, Treemap } from 'vccs'

const data = [
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
      { name: 'NodeSprite', value: 19382 },
    ],
  },
  {
    name: 'events',
    children: [
      { name: 'DataEvent', value: 7313 },
      { name: 'SelectionEvent', value: 6880 },
      { name: 'TooltipEvent', value: 3701 },
    ],
  },
]

const COLORS = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
</script>

<template>
  <Treemap
    :width="730"
    :height="300"
    :data="data"
    data-key="value"
    :colors="COLORS"
    stroke="#fff"
  >
    <Tooltip :cursor="false" />
  </Treemap>
</template>
