<script setup>
import { CalendarHeatmap, Tooltip } from 'vccs'

// Deterministic sample data: busier on weekdays, quiet on weekends.
const data = Array.from({ length: 365 }, (_, i) => {
  const date = new Date(Date.UTC(2025, 0, 1 + i))
  const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6
  const wave = (Math.sin(i / 9) + 1) * 3 + ((i * 37) % 5)
  return { date: date.toISOString().slice(0, 10), count: weekend ? Math.round(wave / 4) : Math.round(wave) }
})
</script>

<template>
  <CalendarHeatmap
    :data="data"
    data-key="count"
    start="2025-01-01"
    end="2025-12-31"
    color="#14b8a6"
  >
    <Tooltip :cursor="false" />
  </CalendarHeatmap>
</template>
