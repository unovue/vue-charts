<script setup lang="ts">
import { dot, plot, pointer, tip } from '@observablehq/plot'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ScatterRow } from '../datasets'

const props = defineProps<{ data: ScatterRow[], dark: boolean }>()

const container = ref<HTMLElement>()
let observer: ResizeObserver | undefined

function render() {
  if (!container.value)
    return
  const chart = plot({
    width: container.value.clientWidth,
    height: 270,
    style: { background: 'transparent' },
    x: { label: null },
    y: { label: null },
    color: { legend: true },
    marks: [
      dot(props.data, { x: 'x', y: 'y', stroke: 'group' }),
      tip(props.data, pointer({
        x: 'x',
        y: 'y',
        fill: props.dark ? '#18181b' : '#fff',
        title: (row: ScatterRow) => `${row.group}\nx ${row.x}\ny ${row.y}`,
      })),
    ],
  })
  container.value.replaceChildren(chart)
}

onMounted(() => {
  render()
  observer = new ResizeObserver(render)
  observer.observe(container.value!)
})
onBeforeUnmount(() => observer?.disconnect())
watch(() => [props.data, props.dark], render)
</script>

<template>
  <div
    ref="container"
    :style="{ color: dark ? '#e4e4e7' : '#18181b', height: '300px' }"
  />
</template>
