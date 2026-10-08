<script setup lang="ts">
import type { ChartConfig } from './types'

const props = defineProps<{
  id: string
  config: ChartConfig
}>()

// Same contract as shadcn: `color` for both themes, or `theme: { light, dark }`.
const THEMES = { light: '', dark: '.dark' } as const
// A literal <style> in a template is stripped by the SFC compiler.
const styleTag = 'style'

const css = computed(() => {
  const entries = Object.entries(props.config).filter(([, item]) => item.theme || item.color)
  if (!entries.length)
    return ''
  return Object.entries(THEMES).map(([theme, prefix]) => {
    const vars = entries
      .map(([key, item]) => {
        const color = item.theme?.[theme as keyof typeof THEMES] ?? item.color
        return color ? `  --color-${key}: ${color};` : null
      })
      .filter(Boolean)
      .join('\n')
    return `${prefix} [data-chart=${props.id}] {\n${vars}\n}`
  }).join('\n')
})
</script>

<template>
  <component
    :is="styleTag"
    v-if="css"
  >
    {{ css }}
  </component>
</template>
