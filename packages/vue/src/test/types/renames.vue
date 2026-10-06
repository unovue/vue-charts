<script setup lang="ts">
import { BarList, CartesianGrid, CohortChart, Heatmap, JourneySankey, Legend, Radar, RadialBar, ResponsiveContainer, SunburstChart, Tooltip, Tracker, Treemap, defineChartComponents } from '../../index'

interface Row { name: string, value: number, x: number, y: number, status: string, cohort: string, values: number[], path: string[] }
const rows: Row[] = [{ name: 'A', value: 3, x: 1, y: 2, status: 'success', cohort: 'Oct', values: [3, 2], path: ['A', 'B'] }]
const Chart = defineChartComponents<Row>()({ Tooltip, Radar, RadialBar, Treemap, CartesianGrid })
function numeric(value: number | undefined) { return value }
function text(value: string | undefined) { return value }
</script>

<template>
  <Heatmap
    :data="rows"
    :value-formatter="(value, cell) => `${value}: ${cell.rows[0]?.name}`"
    :x-tick-formatter="x => String(x)"
    :y-tick-formatter="y => String(y)"
  />
  <BarList
    :data="rows"
    :value-formatter="(value, row) => `${row.name}: ${value}`"
  />
  <CohortChart
    :data="rows"
    :period-formatter="period => String(period)"
  />
  <JourneySankey
    :data="rows"
    :subtitle-formatter="node => node.rows[0]?.name ?? ''"
    @node-click="(node, index, event) => { text(node.rows[0]?.name); numeric(index); event.preventDefault() }"
    @link-click="(link, index, event) => { text(link.rows[0]?.name); numeric(index); event.preventDefault() }"
    @node-mouseenter="(node, index, event) => { text(node.rows[0]?.name); numeric(index); event.preventDefault() }"
    @node-mouseleave="(node, index, event) => { text(node.rows[0]?.name); numeric(index); event.preventDefault() }"
    @link-mouseenter="(link, index, event) => { text(link.rows[0]?.name); numeric(index); event.preventDefault() }"
    @link-mouseleave="(link, index, event) => { text(link.rows[0]?.name); numeric(index); event.preventDefault() }"
  />
  <SunburstChart
    :data="{ name: 'root', children: [{ name: 'A', value: 3 }] }"
    @node-click="(node, index, event) => { numeric(node.depth); numeric(index); event.preventDefault() }"
    @node-mouseenter="(node, index, event) => { numeric(node.depth); numeric(index); event.preventDefault() }"
    @node-mouseleave="(node, index, event) => { numeric(node.depth); numeric(index); event.preventDefault() }"
  />
  <Tracker
    :data="rows"
    :status-colors="{ success: 'green' }"
    :status-labels="{ success: 'Success' }"
  />
  <Chart.Treemap
    :data="rows"
    :tile-aspect-ratio="1"
    :colors="['red', 'blue']"
  />
  <Tooltip
    to="body"
    :label-formatter="(label, payload) => `${label}: ${payload[0]?.name}`"
  />
  <Legend to="body" />
  <Chart.Tooltip
    :label-formatter="(label, payload) => `${label}: ${payload[0]?.payload.name}`"
    :formatter="(value, name, item, index, payload) => `${value}: ${name}: ${item.payload.name}: ${index}: ${payload[0]?.payload.name}`"
  />
  <!-- @vue-expect-error Tooltip labelFormatter payload rows are Row. -->
  <Chart.Tooltip :label-formatter="(_label, payload) => payload[0]?.payload.nope" />
  <!-- @vue-expect-error Tooltip formatter payload rows are Row. -->
  <Chart.Tooltip :formatter="(_value, _name, _item, _index, payload) => payload[0]?.payload.nope" />
  <Chart.Radar data-key="value">
    <template #dot="{ cx, cy, index, payload }">
      {{ numeric(cx) }} {{ numeric(cy) }} {{ numeric(index) }} {{ text(payload.name) }}
    </template>
    <template #shape="{ points }">
      {{ text(points[0]?.payload.name) }}
    </template>
  </Chart.Radar>
  <Chart.RadialBar data-key="value">
    <template #shape="{ cx, cy, startAngle, endAngle, payload }">
      {{ numeric(cx) }} {{ numeric(cy) }} {{ numeric(startAngle) }} {{ numeric(endAngle) }} {{ text(payload.name) }}
    </template>
  </Chart.RadialBar>
  <CartesianGrid>
    <template #horizontal="{ x1, y1, x2, y2, index }">
      {{ numeric(x1) }} {{ numeric(y1) }} {{ numeric(x2) }} {{ numeric(y2) }} {{ numeric(index) }}
    </template>
    <template #vertical="{ x1, y1, x2, y2, index }">
      {{ numeric(x1) }} {{ numeric(y1) }} {{ numeric(x2) }} {{ numeric(y2) }} {{ numeric(index) }}
    </template>
  </CartesianGrid>
  <Chart.CartesianGrid>
    <template #horizontal="props">
      <!-- @vue-expect-error Grid line slots do not contain a source-row payload. -->
      {{ text(props.payload.name) }}
    </template>
  </Chart.CartesianGrid>
  <ResponsiveContainer @resize="(width, height) => { numeric(width); numeric(height) }" />
  <!-- @vue-expect-error Heatmap removed valueFormat. -->
  <Heatmap
    :data="rows"
    :value-format="() => ''"
  />
  <!-- @vue-expect-error Heatmap removed the previous column-label formatter. -->
  <Heatmap
    :data="rows"
    :x-label-format="() => ''"
  />
  <!-- @vue-expect-error Heatmap removed the previous row-label formatter. -->
  <Heatmap
    :data="rows"
    :y-label-format="() => ''"
  />
  <!-- @vue-expect-error BarList removed valueFormat. -->
  <BarList
    :data="rows"
    :value-format="() => ''"
  />
  <!-- @vue-expect-error Cohort removed the previous period formatter. -->
  <CohortChart
    :data="rows"
    :period-label="() => ''"
  />
  <!-- @vue-expect-error Journey removed the previous subtitle formatter. -->
  <JourneySankey
    :data="rows"
    :format-subtitle="() => ''"
  />
  <!-- @vue-expect-error Tracker removed colors in favor of statusColors. -->
  <Tracker
    :data="rows"
    :colors="{ success: 'green' }"
  />
  <!-- @vue-expect-error Tracker removed labels in favor of statusLabels. -->
  <Tracker
    :data="rows"
    :labels="{ success: 'Success' }"
  />
  <!-- @vue-expect-error Treemap removed tile ratio aspectRatio. -->
  <Chart.Treemap
    :data="rows"
    :aspect-ratio="1"
  />
  <!-- @vue-expect-error Treemap removed the previous palette prop. -->
  <Chart.Treemap
    :data="rows"
    :color-panel="['red']"
  />
  <!-- @vue-expect-error Tooltip content is a slot. -->
  <Tooltip :content="() => ''" />
  <!-- @vue-expect-error Tooltip removed portal. -->
  <Tooltip portal="body" />
  <!-- @vue-expect-error Legend removed portal. -->
  <Legend portal="body" />
  <!-- @vue-expect-error Resize event dimensions are numeric. -->
  <ResponsiveContainer @resize="(width: string) => text(width)" />
</template>
