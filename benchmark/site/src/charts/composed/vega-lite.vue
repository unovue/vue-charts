<script setup lang="ts">
import embed from 'vega-embed'
import type { Result, VisualizationSpec } from 'vega-embed'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { LineRow } from '../line/data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

const container = ref<HTMLElement>()
let result: Result | undefined

function spec(): VisualizationSpec {
  const series = { field: 'series', type: 'nominal' as const, title: null, scale: { domain: ['Desktop', 'Mobile', 'Tablet'] } }
  const named = (name: string) => [{ calculate: `'${name}'`, as: 'series' }]
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    width: 'container',
    height: 250,
    background: 'transparent',
    data: { values: props.data },
    encoding: { x: { field: 'month', type: 'ordinal', sort: null, title: null } },
    layer: [
      { transform: named('Desktop'), mark: 'bar', encoding: { y: { field: 'desktop', type: 'quantitative', title: null }, color: series } },
      { transform: named('Tablet'), mark: { type: 'area', interpolate: 'monotone' }, encoding: { y: { field: 'tablet', type: 'quantitative' }, color: series } },
      { transform: named('Mobile'), mark: { type: 'line', interpolate: 'monotone' }, encoding: { y: { field: 'mobile', type: 'quantitative' }, color: series } },
      {
        mark: { type: 'rule', color: props.dark ? '#e4e4e7' : '#18181b' },
        encoding: {
          opacity: { condition: { value: 0.5, param: 'hover', empty: false }, value: 0 },
          tooltip: [{ field: 'month', title: 'Month' }, { field: 'desktop', title: 'Desktop' }, { field: 'mobile', title: 'Mobile' }, { field: 'tablet', title: 'Tablet' }],
        },
        params: [{ name: 'hover', select: { type: 'point', fields: ['month'], nearest: true, on: 'pointermove', clear: 'pointerout' } }],
      },
    ],
  }
}

async function render() {
  result?.finalize()
  if (container.value)
    result = await embed(container.value, spec(), { actions: false, theme: props.dark ? 'dark' : undefined, tooltip: { theme: props.dark ? 'dark' : 'light' } })
}

onMounted(render)
onBeforeUnmount(() => result?.finalize())
watch(() => [props.data, props.dark], render)
</script>

<template>
  <div
    ref="container"
    style="width: 100%; height: 300px"
  />
</template>
