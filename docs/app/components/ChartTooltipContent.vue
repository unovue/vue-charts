<script setup lang="ts">
const props = withDefaults(defineProps<{
  active?: boolean
  payload?: ReadonlyArray<Record<string, any>>
  label?: string | number
  labelFormatter?: (value: string | number, payload: ReadonlyArray<Record<string, any>>) => string
  indicator?: 'dot' | 'line' | 'dashed'
  hideLabel?: boolean
  hideIndicator?: boolean
}>(), {
  indicator: 'dot',
})

function getItemColor(item: Record<string, any>): string {
  return item.color || item.payload?.fill || '#888'
}

function getItemLabel(item: Record<string, any>): string {
  return item.name ?? item.dataKey ?? ''
}

const formattedLabel = computed(() => {
  if (props.hideLabel || !props.label)
    return null
  if (props.labelFormatter && props.payload && props.label != null) {
    return props.labelFormatter(props.label, props.payload)
  }
  return props.label
})

const nestLabel = computed(() => {
  return props.payload?.length === 1 && props.indicator !== 'dot'
})
</script>

<template>
  <div
    v-if="active && payload?.length"
    class="chart-tooltip"
  >
    <div
      v-if="!hideLabel && formattedLabel && indicator !== 'line'"
      class="chart-tooltip-label"
    >
      {{ formattedLabel }}
    </div>

    <div class="chart-tooltip-items">
      <div
        v-for="(item, index) in payload"
        :key="item.dataKey ?? index"
        class="chart-tooltip-item"
      >
        <div
          v-if="!hideIndicator"
          class="chart-tooltip-indicator"
          :class="{
            'indicator-dot': indicator === 'dot',
            'indicator-line': indicator === 'line',
            'indicator-dashed': indicator === 'dashed',
          }"
          :style="{
            '--indicator-color': getItemColor(item),
          }"
        />

        <div
          class="chart-tooltip-content"
          :class="nestLabel ? 'align-end' : 'align-center'"
        >
          <div class="chart-tooltip-label-group">
            <span
              v-if="nestLabel && formattedLabel"
              class="chart-tooltip-label"
            >
              {{ formattedLabel }}
            </span>
            <span class="chart-tooltip-name">
              {{ getItemLabel(item) }}
            </span>
          </div>

          <span class="chart-tooltip-value">
            {{ typeof item.value === 'number' ? item.value.toLocaleString() : item.value }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-tooltip {
  display: grid;
  min-width: 8rem;
  align-items: start;
  gap: 6px;
  border-radius: 8px;
  border: 1px solid var(--ui-border, #e5e7eb);
  border-color: color-mix(in srgb, var(--ui-border, #e5e7eb) 50%, transparent);
  background: var(--ui-bg-elevated, #fff);
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

.chart-tooltip-label {
  font-weight: 500;
}

.chart-tooltip-items {
  display: grid;
  gap: 6px;
}

.chart-tooltip-item {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 8px;
}

.chart-tooltip-indicator {
  flex-shrink: 0;
  border-radius: 2px;
  background: var(--indicator-color);
  border: 1px solid var(--indicator-color);
}

.chart-tooltip-indicator.indicator-dot {
  width: 6px;
  height: 6px;
  align-self: center;
  border-radius: 50%;
}

.chart-tooltip-indicator.indicator-line {
  width: 4px;
}

.chart-tooltip-indicator.indicator-dashed {
  width: 0;
  border-width: 1.5px;
  border-style: dashed;
  background: transparent;
}

.chart-tooltip-content {
  display: flex;
  flex: 1;
  justify-content: space-between;
  line-height: 1;
}

.chart-tooltip-content.align-end {
  align-items: flex-end;
}

.chart-tooltip-content.align-center {
  align-items: center;
}

.chart-tooltip-label-group {
  display: grid;
  gap: 6px;
}

.chart-tooltip-name {
  color: var(--ui-text-muted, #6b7280);
}

.chart-tooltip-value {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text, #111827);
}
</style>

<style>
/* Unscoped on purpose: scoped `:global(.dark) .x` compiles to a bare `.dark`
   selector and never matches (see docs/adr/0008-chart-demo-cube-code-card.md). */
.dark .chart-tooltip {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
}
</style>
