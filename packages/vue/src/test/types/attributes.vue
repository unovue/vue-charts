<script setup lang="ts">
// Strict templates must accept the SVG, aria-* and data-* attributes that components forward,
// and public XxxProps types must stay limited to what each component declares.
import type { BarChartProps, CartesianGridProps, FunnelChartProps, PieChartProps } from '../../index'
import { Area, Bar, BarChart, BarList, Brush, CartesianGrid, Cell, Cross, Curve, Dot, ErrorBar, Heatmap, Label, LabelList, Line, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Polygon, Radar, RadialBar, Rectangle, ReferenceArea, ReferenceDot, ReferenceLine, Sankey, Scatter, Sector, Sparkline, Symbols, Text, Trapezoid, Treemap, XAxis, YAxis } from '../../index'

// @ts-expect-error Cartesian charts do not declare polar geometry.
export type CartesianPolarProp = BarChartProps['cx']
// @ts-expect-error Pie charts do not declare bar sizing.
export type PieBarProp = PieChartProps['barSize']
// @ts-expect-error Funnel charts do not declare polar geometry.
export type FunnelPolarProp = FunnelChartProps['cx']
// @ts-expect-error Forwarded attributes are not declared props.
export type GridDash = CartesianGridProps['strokeDasharray']
</script>

<template>
  <BarChart
    :data="[]"
    data-testid="chart"
    aria-label="Revenue"
  >
    <CartesianGrid
      stroke-dasharray="3 3"
      data-testid="grid"
    />
    <Bar
      data-key="v"
      stroke-dasharray="3 3"
      aria-label="Revenue"
    >
      <Cell stroke-dasharray="1" />
      <LabelList
        data-key="v"
        font-size="12"
      />
      <ErrorBar
        data-key="v"
        stroke-dasharray="1"
      />
    </Bar>
    <Line
      data-key="v"
      stroke-dasharray="3 3"
      stroke-linecap="round"
    />
    <Area
      data-key="v"
      stroke-dasharray="3 3"
    />
    <Scatter
      data-key="v"
      stroke-dasharray="3 3"
    />
    <XAxis stroke-dasharray="3 3" />
    <YAxis stroke-dasharray="3 3" />
    <ReferenceLine
      :y="1"
      stroke-dasharray="3 3"
    >
      <Label
        value="Target"
        font-size="12"
      />
    </ReferenceLine>
    <ReferenceArea stroke-dasharray="3 3" />
    <ReferenceDot
      :x="1"
      :y="1"
      stroke-dasharray="3 3"
    />
    <Brush
      aria-label="Date range"
      data-testid="range"
    />
    <!-- @vue-expect-error Unknown props stay errors. -->
    <Line
      data-key="v"
      :not-a-prop="1"
    />
    <!-- @vue-expect-error Declared props keep their own types. -->
    <Line
      data-key="v"
      :stroke-width="{}"
    />
  </BarChart>
  <PieChart>
    <Pie
      data-key="v"
      stroke-dasharray="3 3"
    />
    <Radar
      data-key="v"
      stroke-dasharray="3 3"
    />
    <RadialBar
      data-key="v"
      stroke-dasharray="3 3"
    />
    <PolarGrid stroke-dasharray="3 3" />
    <PolarAngleAxis stroke-dasharray="3 3" />
    <PolarRadiusAxis stroke-dasharray="3 3" />
  </PieChart>
  <svg>
    <Cross stroke-dasharray="1" />
    <Curve
      :points="[]"
      stroke-dasharray="1"
    />
    <Dot stroke-dasharray="1" />
    <Polygon
      :points="[{ x: 1, y: 1 }]"
      stroke-dasharray="1"
    />
    <Rectangle stroke-dasharray="1" />
    <Sector stroke-dasharray="1" />
    <Symbols stroke-dasharray="1" />
    <Trapezoid stroke-dasharray="1" />
    <Text
      font-size="12"
      data-testid="text"
    >
      Label
    </Text>
  </svg>
  <Sankey
    :data="{ nodes: [], links: [] }"
    data-testid="sankey"
  />
  <Treemap
    :data="[]"
    data-testid="treemap"
  />
  <BarList
    :data="[]"
    data-testid="bar-list"
  />
  <Heatmap
    :data="[]"
    data-testid="heatmap"
  />
  <Sparkline
    :data="[]"
    data-testid="sparkline"
  />
</template>
