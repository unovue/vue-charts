<script setup lang="ts">
import { barY, plot, pointerX, tip } from '@observablehq/plot'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { BarRow } from '../datasets'

const props = defineProps<{ data: BarRow[], dark: boolean }>()

const container = ref<HTMLElement>()
let observer: ResizeObserver | undefined

function render() {
  if (!container.value)
    return
  const rows = props.data.flatMap(row => [
    { segment: row.segment, series: 'Desktop', value: row.desktop },
    { segment: row.segment, series: 'Mobile', value: row.mobile },
    { segment: row.segment, series: 'Tablet', value: row.tablet },
  ])
  const title = (row: { segment: string, series: string, value: number }) => `${row.segment}\n${row.series} ${row.value}`
  const chart = plot({
    width: container.value.clientWidth,
    height: 270,
    style: { background: 'transparent' },
    x: { label: null, domain: props.data.map(row => row.segment) },
    y: { label: null },
    color: { legend: true },
    marks: [
      barY(rows, { x: 'segment', y: 'value', fill: 'series' }),
      tip(rows, pointerX({ x: 'segment', y: 'value', title, fill: props.dark ? '#18181b' : '#fff' })),
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
