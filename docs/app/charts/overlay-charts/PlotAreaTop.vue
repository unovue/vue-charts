<script setup>
import { usePlotArea } from 'vccs'

const plotArea = usePlotArea()
</script>

<template>
  <g>
    <line
      :x1="plotArea.x"
      :x2="plotArea.x + plotArea.width"
      :y1="plotArea.y"
      :y2="plotArea.y"
      stroke="#14b8a6"
      stroke-dasharray="4 4"
    />
    <text
      :x="plotArea.x + 4"
      :y="plotArea.y - 6"
      fill="#14b8a6"
      font-size="12"
    >
      Plot area top
    </text>
  </g>
</template>
