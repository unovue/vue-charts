<script setup lang="ts">
import { SunburstChart, Tooltip } from 'vccs'

const data = {
  name: 'root',
  children: [
    {
      name: 'Category A',
      fill: '#f97316',
      children: [
        { name: 'A-1', value: 100 },
        { name: 'A-2', value: 200 },
        { name: 'A-3', value: 50 },
      ],
    },
    {
      name: 'Category B',
      fill: '#14b8a6',
      children: [
        { name: 'B-1', value: 150 },
        { name: 'B-2', value: 100 },
      ],
    },
    {
      name: 'Category C',
      fill: '#f59e0b',
      children: [
        { name: 'C-1', value: 300 },
        {
          name: 'C-2',
          fill: '#06b6d4',
          children: [
            { name: 'C-2-a', value: 80 },
            { name: 'C-2-b', value: 120 },
          ],
        },
      ],
    },
  ],
}
</script>

<template>
  <div class="container py-10">
    <div class="mb-10 max-w-lg">
      <h1 class="text-2xl font-bold tracking-tight">
        Sunburst Charts
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Hierarchical data displayed as concentric ring sectors.
      </p>
    </div>

    <SunburstChart
      :data="data"
      :width="500"
      :height="500"
    >
      <Tooltip :cursor="false" />
    </SunburstChart>
  </div>
</template>
