<script setup lang="ts">
import embed from 'vega-embed'
import type { Result, VisualizationSpec } from 'vega-embed'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { LineRow } from './data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

const container = ref<HTMLElement>()
let result: Result | undefined

function spec(): VisualizationSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    width: 'container',
    height: 250,
    background: 'transparent',
    data: { values: props.data },
    transform: [
      { fold: ['desktop', 'mobile', 'tablet'], as: ['key', 'value'] },
      { calculate: `{ desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet' }[datum.key]`, as: 'series' },
    ],
    encoding: { x: { field: 'month', type: 'ordinal', sort: null, title: null } },
    layer: [
      {
        mark: { type: 'line', interpolate: 'monotone' },
        encoding: { y: { field: 'value', type: 'quantitative', title: null }, color: { field: 'series', type: 'nominal', title: null } },
      },
      {
        transform: [{ pivot: 'series', value: 'value', groupby: ['month'] }],
        mark: { type: 'rule', color: props.dark ? '#e4e4e7' : '#18181b' },
        encoding: {
          opacity: { condition: { value: 0.5, param: 'hover', empty: false }, value: 0 },
          tooltip: [{ field: 'month', title: 'Month' }, { field: 'Desktop', type: 'quantitative' }, { field: 'Mobile', type: 'quantitative' }, { field: 'Tablet', type: 'quantitative' }],
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
