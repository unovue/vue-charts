<script setup lang="ts">
import { ref } from 'vue'
import type { BrushStartEndIndex } from 'vccs'
import { Area, AreaChart, Bar, BarChart, Brush, CartesianGrid, Tooltip, XAxis, YAxis } from 'vccs'

const data = Array.from({ length: 30 }, (_, i) => ({
  day: `Sep ${i + 1}`,
  orders: Math.round(120 + 60 * Math.sin(i / 3) + (i % 4) * 15),
}))

const range = ref<BrushStartEndIndex | null>({ startIndex: 10, endIndex: 19 })
</script>

<template>
  <div class="w-full">
    <BarChart
      :data="data"
      :height="320"
    >
      <CartesianGrid
        stroke-dasharray="3 3"
        :vertical="false"
      />
      <XAxis data-key="day" />
      <YAxis />
      <Tooltip :cursor="false">
        <template #content="{ active, payload, label }">
          <ChartTooltipContent
            :active="active"
            :payload="payload"
            :label="label"
          />
        </template>
      </Tooltip>
      <Bar
        data-key="orders"
        fill="#f97316"
      />
      <Brush
        v-model:range="range"
        data-key="day"
        :height="40"
        stroke="#f97316"
      >
        <AreaChart>
          <Area
            data-key="orders"
            stroke="#14b8a6"
            fill="#14b8a6"
            :fill-opacity="0.2"
          />
        </AreaChart>
      </Brush>
    </BarChart>
    <p class="mt-2 text-center text-[13px] text-(--ds-muted)">
      <template v-if="range">
        Showing {{ data[range.startIndex]?.day }} to {{ data[range.endIndex]?.day }}
      </template>
      <template v-else>
        Showing all days
      </template>
    </p>
  </div>
</template>
