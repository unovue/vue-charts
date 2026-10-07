<script setup>
import { CartesianGrid, ErrorBar, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'vccs'

// errorX and errorY are a single spread (both sides) or [below, above].
const data = [
  { size: 100, weight: 200, errorX: 8, errorY: 30 },
  { size: 120, weight: 100, errorX: [12, 6], errorY: [40, 20] },
  { size: 170, weight: 300, errorX: 10, errorY: [10, 45] },
  { size: 140, weight: 250, errorX: 6, errorY: 30 },
  { size: 150, weight: 380, errorX: 9, errorY: [20, 60] },
  { size: 110, weight: 280, errorX: 14, errorY: 40 },
]
</script>

<template>
  <ScatterChart
    :height="320"
    :margin="{ top: 20, right: 20, bottom: 20, left: 0 }"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis
      type="number"
      data-key="size"
      name="Size"
      unit="cm"
      :domain="[80, 190]"
    />
    <YAxis
      type="number"
      data-key="weight"
      name="Weight"
      unit="kg"
    />
    <Tooltip :cursor="false">
      <template #content="{ active, payload }">
        <ChartTooltipContent
          :active="active"
          :payload="payload"
          hide-label
        />
      </template>
    </Tooltip>
    <Scatter
      name="Samples"
      :data="data"
      fill="#f97316"
    >
      <ErrorBar
        data-key="errorX"
        direction="x"
        :width="4"
        stroke="#14b8a6"
      />
      <ErrorBar
        data-key="errorY"
        direction="y"
        :width="4"
        stroke="#06b6d4"
      />
    </Scatter>
  </ScatterChart>
</template>
