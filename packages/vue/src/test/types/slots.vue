<script setup lang="ts">
import {
  Area,
  Bar,
  Brush,
  Customized,
  Funnel,
  Label,
  LabelList,
  Legend,
  Line,
  Pie,
  PolarAngleAxis,
  PolarRadiusAxis,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  Sankey,
  Scatter,
  SunburstChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from '../../index'

// Reject any as well as incorrect geometry types: this catches lost slot inference.
function number<T extends number | undefined>(value: T & (0 extends (1 & T) ? never : unknown)) { return value }
function text(value: string | undefined) { return value }
</script>

<template>
  <Tooltip>
    <template #content="{ active, payload, label }">
      {{ active ? payload?.[0]?.value : label }}
      <!-- @vue-expect-error Tooltip active is boolean, not a number. -->
      {{ number(active) }}
    </template>
    <template #cursor="{ width, height }">
      {{ number(width) }} {{ number(height) }}
    </template>
  </Tooltip>
  <Legend>
    <template #content="{ payload }">
      {{ payload[0]?.value?.toUpperCase() }}
    </template>
  </Legend>
  <XAxis>
    <template #tick="{ x, payload }">
      {{ number(x) }} {{ payload.value }}
      <!-- @vue-expect-error Tick payload contains no invented field. -->
      {{ payload.nope }}
    </template>
  </XAxis>
  <YAxis>
    <template #tick="{ y, payload }">
      {{ number(y) }} {{ payload.value }}
    </template>
  </YAxis>
  <PolarAngleAxis>
    <template #tick="{ cx, payload }">
      {{ number(cx) }} {{ payload.value }}
    </template>
  </PolarAngleAxis>
  <Bar data-key="value">
    <template #label="{ index }">
      {{ number(index) }}
    </template>
    <template #shape="{ x, width }">
      {{ number(x ?? 0) }} {{ number(width) }}
      <!-- @vue-expect-error Shape width is numeric. -->
      {{ text(width) }}
    </template>
    <template #activeBar="{ index, height }">
      {{ number(index) }} {{ number(height) }}
    </template>
  </Bar>
  <Line data-key="value">
    <template #dot="{ cx, cy }">
      {{ number(cx) }} {{ number(cy) }}
    </template>
    <template #activeDot="{ cx, cy, value, index }">
      {{ number(cx) }} {{ number(cy) }} {{ number(value) }} {{ number(index) }}
    </template>
    <template #shape="{ points }">
      {{ points?.[0]?.x }}
    </template>
    <template #label="{ value, index }">
      {{ value }} {{ number(index) }}
    </template>
  </Line>
  <!-- @vue-expect-error Render functions are not dot options; use the #dot slot. -->
  <Line
    data-key="value"
    :dot="() => null"
  />
  <!-- @vue-expect-error Render functions are not activeDot options; use the #activeDot slot. -->
  <Area
    data-key="value"
    :active-dot="() => null"
  />
  <Area data-key="value">
    <template #label="{ index }">
      {{ number(index) }}
    </template>
    <template #dot="{ cx, cy }">
      {{ number(cx) }} {{ number(cy) }}
    </template>
    <template #activeDot="{ cx, cy, value, index }">
      {{ number(cx) }} {{ number(cy) }} {{ Array.isArray(value) ? number(value[0]) : number(value) }} {{ number(index) }}
    </template>
  </Area>
  <Pie data-key="value">
    <template #label="{ index }">
      {{ number(index) }}
    </template>
    <template #activeShape="{ cx }">
      {{ number(cx) }}
    </template>
    <template #shape="{ cx, isActive }">
      {{ number(cx) }} {{ isActive }}
    </template>
  </Pie>
  <Funnel data-key="value">
    <template #shape="{ x, width }">
      {{ number(x ?? 0) }} {{ number(width) }}
    </template>
  </Funnel>
  <Treemap :data="[]">
    <template #content="{ x, width }">
      {{ number(x ?? 0) }} {{ number(width) }}
    </template>
  </Treemap>
  <SunburstChart :data="{ name: 'root', value: 1 }">
    <template #content="{ index }">
      {{ number(index) }}
    </template>
  </SunburstChart>
  <Sankey :data="{ nodes: [], links: [] }">
    <template #node="{ x, width }">
      {{ number(x ?? 0) }} {{ number(width) }}
    </template>
    <template #link="{ d, linkWidth }">
      {{ text(d) }} {{ number(linkWidth) }}
    </template>
  </Sankey>
  <Label><template #content="{ viewBox, value }">{{ viewBox }} {{ value }}</template></Label>
  <LabelList>
    <template #label="{ value, index }">
      {{ value }} {{ number(index) }}
    </template>
  </LabelList>
  <ReferenceDot>
    <template #shape="{ cx, r }">
      {{ number(cx) }} {{ number(r) }}
    </template>
  </ReferenceDot>
  <Brush>
    <template #default>
      <span />
    </template>
  </Brush>
  <Customized>
    <template #default="{ chartWidth, formattedGraphicalItems }">
      {{ number(chartWidth) }} {{ formattedGraphicalItems[0]?.type }}
    </template>
  </Customized>
  <Scatter>
    <template #shape="{ cx, index }">
      {{ number(cx) }} {{ number(index) }}
    </template>
  </Scatter>
  <PolarRadiusAxis>
    <template #tick="{ x, payload }">
      {{ number(x) }} {{ payload.value }}
    </template>
  </PolarRadiusAxis>
  <ReferenceLine>
    <template #shape="{ x1 }">
      {{ number(x1) }}
    </template>
  </ReferenceLine>
  <ReferenceArea>
    <template #shape="{ width }">
      {{ number(width) }}
    </template>
  </ReferenceArea>
  <LabelList>
    <template #content="{ index }">
      {{ number(index) }}
    </template>
  </LabelList>
</template>
