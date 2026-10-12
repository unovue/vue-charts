<script setup lang="ts">
import { useId } from 'vue'

const id = useId()
</script>

<template>
  <div
    data-slot="chart"
    :data-chart="id"
    style="--v-charts-grid: var(--border); --v-charts-axis: var(--border); --v-charts-text: var(--muted-foreground); --v-charts-cursor: var(--border); --v-charts-muted: var(--muted); --v-charts-background: var(--background); --v-charts-inactive: var(--muted-foreground); --v-charts-focus: var(--ring)"
  >
    <slot />
  </div>
</template>
