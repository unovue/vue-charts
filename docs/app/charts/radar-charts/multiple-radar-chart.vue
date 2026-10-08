<script setup>
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Tooltip } from 'vccs'

const data = [
  { subject: 'Math', A: 120, B: 110 },
  { subject: 'Chinese', A: 98, B: 130 },
  { subject: 'English', A: 86, B: 130 },
  { subject: 'Geography', A: 99, B: 100 },
  { subject: 'Physics', A: 85, B: 90 },
  { subject: 'History', A: 65, B: 85 },
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
    <PolarGrid />
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
    <Radar
      data-key="B"
      stroke="#14b8a6"
      fill="#14b8a6"
      :fill-opacity="0.6"
    />
  </RadarChart>
</template>
