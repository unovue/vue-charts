<script setup>
import { LabelList, RadialBar, RadialBarChart, Tooltip } from 'vccs'

const data = [
  { name: 'Chrome', visitors: 275, fill: '#f97316' },
  { name: 'Safari', visitors: 200, fill: '#14b8a6' },
  { name: 'Firefox', visitors: 187, fill: '#f59e0b' },
  { name: 'Edge', visitors: 173, fill: '#06b6d4' },
]
</script>

<template>
  <RadialBarChart
    :data="data"
    :inner-radius="30"
    :outer-radius="120"
    :start-angle="-90"
    :end-angle="380"
    :height="300"
  >
    <RadialBar
      data-key="visitors"
      :background="true"
    >
      <LabelList
        position="insideStart"
        data-key="name"
        class="fill-white capitalize mix-blend-luminosity"
        :font-size="11"
      />
    </RadialBar>
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
