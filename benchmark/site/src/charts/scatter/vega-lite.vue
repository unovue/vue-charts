<script setup lang="ts">
import embed from 'vega-embed'
import type { Result, VisualizationSpec } from 'vega-embed'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ScatterRow } from '../datasets'

const props = defineProps<{ data: ScatterRow[], dark: boolean }>()

const container = ref<HTMLElement>()
let result: Result | undefined

function spec(): VisualizationSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    width: 'container',
    height: 250,
    background: 'transparent',
    data: { values: props.data },
    mark: { type: 'point', tooltip: true },
    encoding: {
      x: { field: 'x', type: 'quantitative', title: null },
      y: { field: 'y', type: 'quantitative', title: null },
      color: { field: 'group', type: 'nominal', title: null },
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
