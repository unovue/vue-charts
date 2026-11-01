<script setup lang="ts">
import embed from 'vega-embed'
import type { Result, VisualizationSpec } from 'vega-embed'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { BarRow } from '../datasets'

const props = defineProps<{ data: BarRow[], dark: boolean }>()

const container = ref<HTMLElement>()
let result: Result | undefined

function spec(): VisualizationSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    width: 'container',
    height: 'container',
    background: 'transparent',
    data: { values: props.data },
    transform: [
      { fold: ['desktop', 'mobile', 'tablet'], as: ['key', 'value'] },
      { calculate: `{ desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet' }[datum.key]`, as: 'series' },
    ],
    mark: { type: 'bar', tooltip: true },
    encoding: {
      x: { field: 'segment', type: 'nominal', sort: null, title: null },
      y: { field: 'value', type: 'quantitative', title: null },
      color: { field: 'series', type: 'nominal', title: null },
      xOffset: { field: 'series', type: 'nominal' },
    },
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
