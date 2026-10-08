<script setup>
import { Tooltip, Treemap } from 'vccs'

const data = [
  {
    name: 'axis',
    children: [
      { name: 'Axes', value: 1302 },
      { name: 'Axis', value: 24593 },
      { name: 'AxisGridLine', value: 652 },
    ],
  },
  {
    name: 'controls',
    children: [
      { name: 'ClickControl', value: 3824 },
      { name: 'ControlList', value: 4665 },
      { name: 'DragControl', value: 2649 },
    ],
  },
  {
    name: 'data',
    children: [
      { name: 'Data', value: 20544 },
      { name: 'DataList', value: 19788 },
    ],
  },
]

const COLORS = ['#f97316', '#14b8a6', '#f59e0b']
</script>

<template>
  <Treemap
    :width="730"
    :height="300"
    :data="data"
    data-key="value"
    :colors="COLORS"
    :is-animation-active="false"
  >
    <template #content="props">
      <g>
        <rect
          :x="props.x"
          :y="props.y"
          :width="props.width"
          :height="props.height"
          :fill="props.fill"
          stroke="#fff"
          rx="3"
        />
        <text
          v-if="props.width > 50 && props.height > 20"
          :x="props.x + 6"
          :y="props.y + 16"
          fill="#fff"
          font-size="12"
          font-weight="500"
        >
          {{ props.name }}
        </text>
        <text
          v-if="props.width > 50 && props.height > 34"
          :x="props.x + 6"
          :y="props.y + 32"
          fill="rgba(255,255,255,0.7)"
          font-size="11"
        >
          {{ props.value.toLocaleString() }}
        </text>
      </g>
    </template>
    <Tooltip :cursor="false" />
  </Treemap>
</template>
