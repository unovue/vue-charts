<script setup lang="ts">
import { areaY, barY, lineY, plot, pointerX, ruleX, tip } from '@observablehq/plot'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { LineRow } from '../line/data'

const props = defineProps<{ data: LineRow[], dark: boolean }>()

const container = ref<HTMLElement>()
let observer: ResizeObserver | undefined

function render() {
  if (!container.value)
    return
  const chart = plot({
    width: container.value.clientWidth,
    height: 270,
    style: { background: 'transparent' },
    x: { type: 'band', domain: props.data.map(row => row.month), label: null },
    y: { label: null },
    color: { legend: true, domain: ['Desktop', 'Mobile', 'Tablet'] },
    marks: [
      barY(props.data, { x: 'month', y: 'desktop', fill: () => 'Desktop' }),
      areaY(props.data, { x: 'month', y: 'tablet', fill: () => 'Tablet', curve: 'monotone-x' }),
      lineY(props.data, { x: 'month', y: 'mobile', stroke: () => 'Mobile', curve: 'monotone-x' }),
      ruleX(props.data, pointerX({ x: 'month' })),
      tip(props.data, pointerX({
        x: 'month',
        fill: props.dark ? '#18181b' : '#fff',
        title: (row: LineRow) => `${row.month}\nDesktop ${row.desktop}\nMobile ${row.mobile}\nTablet ${row.tablet}`,
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
