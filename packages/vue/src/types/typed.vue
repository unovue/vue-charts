<script setup lang="ts">
import { defineChartComponents } from '../index'

interface Visit { name: string, desktop: number, mobile: number }
const {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Legend,
  Area,
  Line,
  Pie,
  Scatter,
  Radar,
  RadialBar,
  Funnel,
  YAxis,
  ZAxis,
  PolarAngleAxis,
  PolarRadiusAxis,
  LabelList,
} = defineChartComponents<Visit>()
const rows: Visit[] = [{ name: 'A', desktop: 10, mobile: 5 }]
function number<T extends number>(value: T & (0 extends (1 & T) ? never : unknown)) { return value }
function key(value: 'name' | 'desktop' | 'mobile' | ((row: Visit) => unknown) | undefined) { return value }
</script>

<template>
  <BarChart
    :data="rows"
    :width="400"
    :height="300"
  >
    <Bar data-key="desktop">
      <template #shape="{ width }">
        {{ number(width) }}
      </template>
    </Bar>
    <Bar :data-key="row => row.desktop" />
    <XAxis data-key="name" />
    <Tooltip>
      <template #content="{ payload, active }">
        {{ active }} {{ number(payload?.[0]?.payload.desktop) }}
        <!-- @vue-expect-error Row payload does not contain nope. -->
        {{ payload[0]?.payload.nope }}
        <!-- @vue-expect-error Desktop is numeric, not string. -->
        {{ payload[0]?.payload.desktop.toUpperCase() }}
      </template>
    </Tooltip>
    <Legend>
      <template #content="{ payload }">
        {{ key(payload[0]?.dataKey) }} {{ payload[0]?.value.toUpperCase() }}
      </template>
    </Legend>
    <Area data-key="desktop" /><Line data-key="mobile" />
    <Pie
      data-key="desktop"
      name-key="name"
    /><Scatter data-key="desktop" />
    <Radar data-key="desktop" /><RadialBar data-key="mobile" /><Funnel
      data-key="desktop"
      name-key="name"
    />
    <YAxis data-key="desktop" /><ZAxis data-key="mobile" />
    <PolarAngleAxis data-key="name" /><PolarRadiusAxis data-key="desktop" />
    <LabelList data-key="desktop" />
    <!-- @vue-expect-error Invalid row key is rejected. -->
    <Bar data-key="nope" />
    <!-- @vue-expect-error Axis keys also come from Visit. -->
    <XAxis data-key="nope" />
    <!-- @vue-expect-error Name keys also come from Visit. -->
    <Pie
      data-key="desktop"
      name-key="nope"
    />
    <!-- @vue-expect-error Key callbacks receive Visit. -->
    <Bar :data-key="row => row.nope" />
  </BarChart>
  <!-- @vue-expect-error Chart data must contain Visit rows. -->
  <BarChart :data="[{ wrong: 1 }]" />
</template>
