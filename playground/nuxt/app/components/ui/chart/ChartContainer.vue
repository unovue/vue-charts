<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { ChartConfig } from './types'
import { cn } from '@/lib/utils'
import ChartStyle from './ChartStyle.vue'

const props = defineProps<{
  id?: string
  class?: HTMLAttributes['class']
  config: ChartConfig
}>()

const uniqueId = useId()
const chartId = computed(() => `chart-${props.id || uniqueId.replace(/:/g, '')}`)

provide('chart-config', computed(() => props.config))
</script>

<template>
  <!-- vccs reads its default colors from --v-charts-* variables; map them to the theme once. -->
  <div
    data-slot="chart"
    :data-chart="chartId"
    :class="cn(
      'flex aspect-video justify-center text-xs',
      '[--v-charts-grid:var(--border)] [--v-charts-axis:var(--border)] [--v-charts-text:var(--muted-foreground)]',
      '[--v-charts-cursor:var(--border)] [--v-charts-muted:var(--muted)] [--v-charts-background:var(--background)]',
      '[--v-charts-inactive:var(--muted-foreground)] [--v-charts-focus:var(--ring)]',
      '[&_.v-charts-surface]:outline-hidden [&_.v-charts-layer]:outline-hidden [&_.v-charts-sector]:outline-hidden',
      // Outer polar labels (radar months, pie labels) may reach past the square plot.
      '[&_.v-charts-surface]:overflow-visible',
      props.class,
    )"
  >
    <ChartStyle
      :id="chartId"
      :config="config"
    />
    <slot />
  </div>
</template>
