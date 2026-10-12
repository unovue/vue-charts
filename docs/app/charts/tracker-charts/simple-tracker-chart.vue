<script setup>
import { Tooltip, Tracker } from 'vccs'

const pattern = ['up', 'up', 'up', 'up', 'up', 'up', 'degraded', 'up', 'up', 'up', 'up', 'down', 'up', 'up', 'maintenance']
const data = Array.from({ length: 60 }, (_, i) => ({
  date: new Date(Date.UTC(2026, 7, 6 + i)).toISOString().slice(0, 10),
  status: pattern[(i * 7) % pattern.length],
}))
const uptime = (data.filter(day => day.status !== 'down').length / data.length * 100).toFixed(2)
</script>

<template>
  <div class="w-full space-y-2">
    <div class="flex justify-between text-sm">
      <span class="font-medium">api.example.com</span>
      <span class="text-(--color-muted-foreground)">{{ uptime }}% uptime</span>
    </div>
    <Tracker
      :data="data"
      :height="32"
    >
      <Tooltip :cursor="false" />
    </Tracker>
    <div class="flex justify-between text-xs text-(--color-muted-foreground)">
      <span>60 days ago</span>
      <span>Today</span>
    </div>
  </div>
</template>
