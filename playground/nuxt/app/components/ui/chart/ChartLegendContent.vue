<script setup lang="ts">
import type { ChartConfig } from './types'

defineProps<{
  payload?: Array<Record<string, any>>
  nameKey?: string
  hideIcon?: boolean
}>()

const config = inject<ComputedRef<ChartConfig>>('chart-config', computed(() => ({})))

function getItemConfig(item: Record<string, any>, nameKey?: string) {
  const cfg = config.value
  const key = nameKey ? item[nameKey] : item.dataKey
  if (key && cfg[key]) {
    return { label: cfg[key].label, color: cfg[key].color || item.color, icon: cfg[key].icon }
  }
  return { label: item.value ?? item.dataKey, color: item.color }
}
</script>

<template>
  <div
    v-if="payload?.length"
    class="flex cursor-default items-center justify-center gap-4"
  >
    <div
      v-for="(item, index) in payload"
      :key="item.dataKey ?? index"
      class="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
    >
      <component
        :is="getItemConfig(item, nameKey).icon"
        v-if="!hideIcon && getItemConfig(item, nameKey).icon"
      />
      <div
        v-else-if="!hideIcon"
        class="h-2 w-2 shrink-0 rounded-[2px]"
        :style="{ backgroundColor: getItemConfig(item, nameKey).color }"
      />
      <span class="text-muted-foreground">
        {{ getItemConfig(item, nameKey).label }}
      </span>
    </div>
  </div>
</template>
