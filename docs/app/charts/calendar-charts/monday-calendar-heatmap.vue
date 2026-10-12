<script setup>
import { CalendarHeatmap, Tooltip } from 'vccs'

const data = Array.from({ length: 120 }, (_, i) => ({
  date: new Date(Date.UTC(2026, 5, 1 + i)).toISOString().slice(0, 10),
  minutes: (i * 53) % 90,
}))
</script>

<template>
  <CalendarHeatmap
    :data="data"
    data-key="minutes"
    start="2026-06-01"
    end="2026-09-28"
    :week-start="1"
    :max="60"
    :colors="['#fff7ed', '#fed7aa', '#fdba74', '#fb923c', '#f97316']"
    locale="de-DE"
    :radius="4"
  >
    <Tooltip :cursor="false" />
  </CalendarHeatmap>
</template>
