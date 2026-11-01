<script setup lang="ts">
import { computed } from 'vue'
import { Sankey, Tooltip } from 'vccs'
import type { SankeyData } from '../datasets'

const props = defineProps<{ data: SankeyData, dark: boolean }>()

const darkTokens = { '--v-charts-text': '#a1a1aa', '--v-charts-axis': '#52525b', '--v-charts-cursor': '#52525b' }
const graph = computed(() => {
  const names = props.data.nodes.map(node => node.id)
  return {
    nodes: names.map(name => ({ name })),
    links: props.data.links.map(link => ({ source: names.indexOf(link.source), target: names.indexOf(link.target), value: link.value })),
  }
})
</script>

<template>
  <div :style="dark ? darkTokens : undefined">
    <Sankey
      :data="graph"
      :height="300"
    >
      <template #node="{ x, y, width, height, payload }">
        <g>
          <rect
            :x="x"
            :y="y"
            :width="width"
            :height="height"
            fill="currentColor"
            :fill-opacity="0.7"
          />
          <text
            :x="x > 200 ? x - 6 : x + width + 6"
            :y="y + height / 2"
            font-size="12"
            dominant-baseline="middle"
            :text-anchor="x > 200 ? 'end' : 'start'"
            fill="currentColor"
          >
            {{ payload.name }}
          </text>
        </g>
      </template>
      <Tooltip />
    </Sankey>
  </div>
</template>
