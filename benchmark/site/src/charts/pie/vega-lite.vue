<script setup lang="ts">
import embed from 'vega-embed'
import type { Result, VisualizationSpec } from 'vega-embed'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ShareRow } from '../datasets'

const props = defineProps<{ data: ShareRow[], dark: boolean }>()

const container = ref<HTMLElement>()
let result: Result | undefined

function spec(): VisualizationSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v6.json',
    width: 'container',
    height: 250,
    background: 'transparent',
    data: { values: props.data },
    mark: { type: 'arc', innerRadius: 60, tooltip: true },
    encoding: {
      theta: { field: 'value', type: 'quantitative' },
      color: { field: 'name', type: 'nominal', title: null, sort: null },
      order: { field: 'name', sort: null },
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
