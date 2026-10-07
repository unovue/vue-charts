<script setup lang="ts">
import { usePlotArea, useYAxisScale } from 'vccs'
import { computed } from 'vue'

const props = defineProps<{ value: number, label: string }>()

// Both composables only work inside a chart, so this component goes in the chart's default slot.
const plotArea = usePlotArea()
const yScale = useYAxisScale()
const y = computed(() => yScale.value?.(props.value))
</script>

<template>
  <g v-if="plotArea && y !== undefined">
    <line
      :x1="plotArea.x"
      :x2="plotArea.x + plotArea.width"
      :y1="y"
      :y2="y"
      stroke="var(--muted-foreground)"
      stroke-dasharray="4 4"
    />
    <text
      :x="plotArea.x + plotArea.width + 4"
      :y="y + 4"
      fill="var(--muted-foreground)"
      font-size="11"
    >
      {{ label }}
    </text>
  </g>
</template>
