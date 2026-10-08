<script setup>
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip } from 'vccs'

const data = [
  { subject: 'Math', A: 120 },
  { subject: 'Chinese', A: 98 },
  { subject: 'English', A: 86 },
  { subject: 'Geography', A: 99 },
  { subject: 'Physics', A: 85 },
  { subject: 'History', A: 65 },
]
</script>

<template>
  <RadarChart
    :data="data"
    cx="50%"
    cy="50%"
    :outer-radius="100"
    :height="300"
  >
    <PolarGrid grid-type="circle" />
    <PolarAngleAxis data-key="subject" />
    <Tooltip :cursor="false">
      <template #content="{ active, payload, label }">
        <ChartTooltipContent
          :active="active"
          :payload="payload"
          :label="label"
        />
      </template>
    </Tooltip>
    <Radar
      data-key="A"
      stroke="#f97316"
      fill="#f97316"
      :fill-opacity="0.6"
    />
  </RadarChart>
</template>
