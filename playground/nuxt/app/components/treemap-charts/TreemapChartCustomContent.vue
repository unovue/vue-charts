<script setup lang="ts">
import { Treemap } from 'vccs'

const chartData = [
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

const colors = ['#f97316', '#14b8a6', '#f59e0b']
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>Custom Content</CardTitle>
      <CardDescription>Using #content slot</CardDescription>
    </CardHeader>
    <CardContent class="flex-1 pb-0">
      <Treemap
        :height="250"
        :data="chartData"
        data-key="value"
        :colors="colors"
        :is-animation-active="true"
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
              font-size="11"
              font-weight="500"
            >
              {{ props.name }}
            </text>
            <text
              v-if="props.width > 50 && props.height > 34"
              :x="props.x + 6"
              :y="props.y + 30"
              fill="rgba(255,255,255,0.7)"
              font-size="10"
            >
              {{ props.value.toLocaleString() }}
            </text>
          </g>
        </template>
      </Treemap>
    </CardContent>
  </Card>
</template>
