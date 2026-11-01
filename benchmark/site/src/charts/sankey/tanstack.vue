<script setup lang="ts">
import { defineChart, link, rect, text } from '@tanstack/charts'
import { d3Curve } from '@tanstack/charts/d3/shape'
import { sankeyDiagram } from '@tanstack/charts/network/sankey'
import { curveBumpX } from 'd3-shape'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/vue'
import { computed } from 'vue'
import type { SankeyData } from '../datasets'

const props = defineProps<{ data: SankeyData, dark: boolean }>()

const definition = computed(() => defineChart({
  marks: [
    sankeyDiagram({
      nodes: props.data.nodes,
      links: props.data.links,
      nodeKey: 'id',
      source: 'source',
      target: 'target',
      value: 'value',
      nodePadding: 24,
      inset: { left: 16, right: 16, top: 24, bottom: 12 },
      marks: ({ nodes, links }) => [
        link(links, { x1: 'x1', y1: 'y1', x2: 'x2', y2: 'y2', key: 'key', curve: d3Curve(curveBumpX), lineCap: 'butt', strokeOpacity: 0.35, strokeWidth: flow => flow.width }),
        rect(nodes, { x1: 'x0', x2: 'x1', y1: 'y0', y2: 'y1', key: 'key', inset: 0 }),
        text(nodes, { x: 'x', y: node => node.y0 - 8, text: node => node.data.id, key: 'key', fill: 'currentColor', fontSize: 12 }),
      ] as const,
    }),
  ],
  scales: { x: null, y: null },
  guides: false,
  margin: 0,
  svgAnimation: true,
  tooltip: {
    use: tooltip,
    format: ({ datum }) => 'sourceKey' in datum ? `${datum.sourceKey} → ${datum.targetKey}: ${datum.value}` : `${datum.key}: ${datum.value}`,
  },
}))
</script>

<template>
  <div :style="{ color: dark ? '#e4e4e7' : '#18181b' }">
    <Chart
      :definition="definition"
      aria-label="Signup flow"
      :height="300"
    />
  </div>
</template>
