<script setup lang="ts">
import { Heatmap, Tooltip } from 'vccs'
import type { HeatmapCell } from 'vccs'
import { ref } from 'vue'

interface Hit { weekday: string, hour: number, visits: number }
const hits = ref<Hit[]>([
  { weekday: 'Mon', hour: 9, visits: 12 },
  { weekday: 'Mon', hour: 9, visits: 8 },
])
const active = ref<number | null>(null)
const selectedRows = ref<readonly Hit[]>([])
function selectCell(cell: HeatmapCell<Hit>) {
  selectedRows.value = cell.rows
}
</script>

<template>
  <!-- generic in Hit: x-key / y-key / data-key are keyof Hit or accessors -->
  <Heatmap
    v-model:active-index="active"
    :data="hits"
    x-key="hour"
    y-key="weekday"
    data-key="visits"
    :levels="5"
    :value-formatter="v => `${v} visits`"
    title="Visits by hour and weekday"
    :aspect="3"
    @cell-click="selectCell"
  >
    <template #cell="{ x, y, width, height, fill, active: cellActive }">
      <rect
        :x
        :y
        :width
        :height
        :fill
        rx="2"
        :stroke="cellActive ? 'currentColor' : 'none'"
      />
    </template>
    <Tooltip :cursor="false" />
  </Heatmap>
  <p>{{ selectedRows.length }} source rows in the selected cell</p>
</template>
