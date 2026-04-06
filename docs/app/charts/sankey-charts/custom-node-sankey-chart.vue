<script setup>
import { Sankey, Tooltip } from 'vccs'

const data = {
  nodes: [
    { name: 'Coal' },
    { name: 'Gas' },
    { name: 'Solar' },
    { name: 'Electricity' },
    { name: 'Heat' },
    { name: 'Industry' },
    { name: 'Homes' },
  ],
  links: [
    { source: 0, target: 3, value: 30 },
    { source: 1, target: 3, value: 20 },
    { source: 2, target: 3, value: 15 },
    { source: 0, target: 4, value: 10 },
    { source: 1, target: 4, value: 8 },
    { source: 3, target: 5, value: 35 },
    { source: 3, target: 6, value: 30 },
    { source: 4, target: 6, value: 18 },
  ],
}
</script>

<template>
  <Sankey
    :data="data"
    :width="730"
    :height="360"
    link-fill="#06b6d4"
  >
    <template #node="{ x, y, width, height, payload }">
      <g>
        <rect
          :x="x"
          :y="y"
          :width="width"
          :height="height"
          fill="#f59e0b"
        />
        <text
          :x="x + width + 6"
          :y="y + height / 2"
          font-size="12"
          dominant-baseline="middle"
          fill="currentColor"
        >
          {{ payload.name }}
        </text>
      </g>
    </template>
    <Tooltip :cursor="false" />
  </Sankey>
</template>
