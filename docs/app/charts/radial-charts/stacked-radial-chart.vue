<script setup>
import { RadialBar, RadialBarChart, Tooltip } from 'vccs'

const data = [
  { desktop: 1260, mobile: 570 },
]
</script>

<template>
  <RadialBarChart
    :data="data"
    :end-angle="180"
    :inner-radius="80"
    :outer-radius="130"
    :height="300"
  >
    <RadialBar
      data-key="desktop"
      fill="#f97316"
      stack-id="a"
      :corner-radius="5"
    />
    <RadialBar
      data-key="mobile"
      fill="#14b8a6"
      stack-id="a"
      :corner-radius="5"
    />
    <Tooltip :cursor="false">
      <template #content="{ active, payload, label }">
        <ChartTooltipContent
          :active="active"
          :payload="payload"
          :label="label"
        />
      </template>
    </Tooltip>
  </RadialBarChart>
</template>
