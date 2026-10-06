<script setup lang="ts">
import { Area, Bar, BarChart, CartesianGrid, ErrorBar, Funnel, LabelList, Legend, Line, Pie, PolarAngleAxis, PolarRadiusAxis, Radar, RadialBar, ReferenceArea, ReferenceDot, ReferenceLine, Scatter, Tooltip, XAxis, YAxis, ZAxis, defineChartComponents } from '../../index'

interface Visit { name: string, desktop: number, mobile: number }
const Chart = defineChartComponents<Visit>()({ BarChart, Bar, XAxis, Tooltip, Legend, Area, Line, Pie, Scatter, Radar, RadialBar, Funnel, YAxis, ZAxis, PolarAngleAxis, PolarRadiusAxis, LabelList, ErrorBar, ReferenceLine, ReferenceDot, ReferenceArea, CartesianGrid })
const rows: Visit[] = [{ name: 'A', desktop: 10, mobile: 5 }]
function number<T extends number>(value: T & (0 extends (1 & T) ? never : unknown)) { return value }
function key(value: 'name' | 'desktop' | 'mobile' | ((row: Visit) => unknown) | undefined) { return value }
</script>

<template>
  <Chart.BarChart
    :data="rows"
    :width="400"
    :height="300"
  >
    <Chart.Bar
      data-key="desktop"
      @click="entry => number(entry.payload.desktop)"
    >
      <template #shape="{ width }">
        {{ number(width ?? 0) }}
      </template>
    </Chart.Bar>
    <Chart.Bar :data-key="row => row.desktop" />
    <Chart.XAxis data-key="name" />
    <Chart.Tooltip>
      <template #content="{ payload, active }">
        {{ active }} {{ number(payload?.[0]?.payload.desktop) }}
        <!-- @vue-expect-error Row payload does not contain nope. -->
        {{ payload[0]?.payload.nope }}
        <!-- @vue-expect-error Desktop is numeric, not string. -->
        {{ payload[0]?.payload.desktop.toUpperCase() }}
      </template>
    </Chart.Tooltip>
    <Chart.Legend>
      <template #content="{ payload }">
        {{ key(payload[0]?.dataKey) }} {{ payload[0]?.value?.toUpperCase() }}
      </template>
    </Chart.Legend>
    <Chart.Area data-key="desktop" /><Chart.Line data-key="mobile" />
    <Chart.Pie
      data-key="desktop"
      name-key="name"
    /><Chart.Scatter data-key="desktop" />
    <Chart.Radar data-key="desktop" /><Chart.RadialBar data-key="mobile" /><Chart.Funnel
      data-key="desktop"
      name-key="name"
    />
    <Chart.YAxis data-key="desktop" /><Chart.ZAxis data-key="mobile" />
    <Chart.PolarAngleAxis data-key="name" /><Chart.PolarRadiusAxis data-key="desktop" />
    <Chart.LabelList data-key="desktop" />
    <!-- @vue-expect-error Invalid row key is rejected. -->
    <Chart.Bar data-key="nope" />
    <!-- @vue-expect-error Axis keys also come from Visit. -->
    <Chart.XAxis data-key="nope" />
    <!-- @vue-expect-error Name keys also come from Visit. -->
    <Chart.Pie
      data-key="desktop"
      name-key="nope"
    />
    <!-- @vue-expect-error Key callbacks receive Visit. -->
    <Chart.Bar :data-key="row => row.nope" />
  </Chart.BarChart>
  <!-- @vue-expect-error Chart data must contain Visit rows. -->
  <Chart.BarChart :data="[{ wrong: 1 }]" />
</template>
