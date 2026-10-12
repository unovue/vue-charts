<script setup>
import { computed, ref } from 'vue'
import { Sparkline } from 'vccs'

const visitors = [820, 932, 901, 934, 1290, 1330, 1320, 1180, 1250, 1410, 1380, 1520, 1490, 1610].map((value, i) => ({ day: `Sep ${i + 17}`, value }))
const hovered = ref(null)
const shown = computed(() => visitors[hovered.value ?? visitors.length - 1])
</script>

<template>
  <div class="grid w-full gap-4 sm:grid-cols-2">
    <div class="rounded-lg border border-(--color-border) p-4">
      <p class="text-sm text-(--color-muted-foreground)">
        Visitors · {{ shown.day }}
      </p>
      <p class="text-2xl font-semibold tabular-nums">
        {{ shown.value.toLocaleString('en-US') }}
      </p>
      <Sparkline
        v-model:active-index="hovered"
        :data="visitors"
        name-key="day"
        type="area"
        color="#f97316"
        :height="40"
      />
    </div>
    <div class="rounded-lg border border-(--color-border) p-4">
      <p class="text-sm text-(--color-muted-foreground)">
        Signups per day
      </p>
      <p class="text-2xl font-semibold tabular-nums">
        48
      </p>
      <Sparkline
        :data="[12, 18, 9, 22, 30, 26, 41, 35, 29, 44, 38, 52, 47, 48]"
        type="bar"
        color="#14b8a6"
        :height="40"
      />
    </div>
  </div>
</template>
