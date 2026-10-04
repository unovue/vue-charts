<script setup>
import { Heatmap, Tooltip } from 'vccs'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
// Deterministic sample: busy working hours, quiet weekends.
const data = days.flatMap((day, d) => Array.from({ length: 24 }, (_, hour) => ({
  day,
  hour,
  visits: Math.round((Math.sin((hour - 7) / 24 * Math.PI * 2) + 1.1) * (d < 5 ? 60 : 25) + ((hour * 7 + d * 13) % 11)),
})))
</script>

<template>
  <Heatmap
    :data="data"
    x-key="hour"
    y-key="day"
    data-key="visits"
    color="#14b8a6"
    :x-label-format="hour => `${hour}h`"
  >
    <Tooltip :cursor="false" />
  </Heatmap>
</template>
