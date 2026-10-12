<script setup lang="ts">
import { usePlotArea } from 'vccs'

// usePlotArea() only works inside a chart, so this component goes in the chart's default slot.
const plotArea = usePlotArea()
</script>

<template>
  <g v-if="plotArea">
    <line
      :x1="plotArea.x"
      :x2="plotArea.x + plotArea.width"
      :y1="plotArea.y"
      :y2="plotArea.y"
      stroke="var(--color-sales)"
      stroke-dasharray="4 4"
      opacity="0.5"
    />
    <text
      :x="plotArea.x + 4"
      :y="plotArea.y - 6"
      fill="var(--color-sales)"
      font-size="11"
    >
      Plot area top
    </text>
  </g>
</template>
