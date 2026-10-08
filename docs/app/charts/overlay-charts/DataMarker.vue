<script setup>
import { computed } from 'vue'
import { useXAxisScale, useYAxisScale } from 'vccs'

const props = defineProps({
  x: { type: String, required: true },
  y: { type: Number, required: true },
  label: { type: String, required: true },
})

const xScale = useXAxisScale()
const yScale = useYAxisScale()
const point = computed(() => {
  const cx = xScale.value?.(props.x)
  const cy = yScale.value?.(props.y)
  return cx == null || cy == null ? undefined : { cx, cy }
})
</script>

<template>
  <g v-if="point">
    <circle
      :cx="point.cx"
      :cy="point.cy"
      r="6"
      fill="none"
      stroke="#14b8a6"
      stroke-width="2"
    />
    <text
      :x="point.cx"
      :y="point.cy - 12"
      fill="#14b8a6"
      font-size="12"
      text-anchor="middle"
    >
      {{ label }}
    </text>
  </g>
</template>
