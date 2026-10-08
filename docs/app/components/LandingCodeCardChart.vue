<script setup lang="ts">
// Chart body for LandingCodeCard — one of four chart types by prop.
// Each chart plays its own entrance when its tab opens; the card only fades the old one out.
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, PolarGrid, Radar, RadarChart, XAxis } from 'vccs'

defineProps<{ type: string }>()

const areaData = [
  { name: 'Jan', v: 400 },
  { name: 'Feb', v: 300 },
  { name: 'Mar', v: 600 },
  { name: 'Apr', v: 800 },
  { name: 'May', v: 500 },
  { name: 'Jun', v: 700 },
]
const pieData = [
  { name: 'Chrome', value: 400 },
  { name: 'Safari', value: 300 },
  { name: 'Other', value: 200 },
]
const pieColors = ['#f97316', '#14b8a6', '#f59e0b']
const radarData = [
  { s: 'Code', v: 86 },
  { s: 'Design', v: 70 },
  { s: 'Docs', v: 78 },
  { s: 'Tests', v: 65 },
  { s: 'Speed', v: 90 },
  { s: 'A11y', v: 74 },
]
</script>

<template>
  <!-- Area -->
  <AreaChart
    v-if="type === 'area'"
    :data="areaData"
    :style="{ width: '100%', height: '160px' }"
  >
    <defs>
      <linearGradient
        id="cd-fill"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop
          offset="5%"
          stop-color="#f97316"
          stop-opacity="0.5"
        />
        <stop
          offset="95%"
          stop-color="#f97316"
          stop-opacity="0"
        />
      </linearGradient>
    </defs>
    <XAxis
      data-key="name"
      :tick="false"
      :axis-line="false"
      :tick-line="false"
    />
    <Area
      type="monotone"
      data-key="v"
      stroke="#f97316"
      fill="url(#cd-fill)"
      :stroke-width="1.5"
    />
  </AreaChart>
  <!-- Bar -->
  <BarChart
    v-else-if="type === 'bar'"
    :data="areaData"
    :style="{ width: '100%', height: '160px' }"
  >
    <XAxis
      data-key="name"
      :tick="false"
      :axis-line="false"
      :tick-line="false"
    />
    <Bar
      data-key="v"
      fill="#f97316"
      :radius="[4, 4, 0, 0]"
    />
  </BarChart>
  <!-- Pie -->
  <PieChart
    v-else-if="type === 'pie'"
    :style="{ width: '100%', height: '160px' }"
  >
    <Pie
      :data="pieData"
      data-key="value"
      :inner-radius="50"
      :outer-radius="80"
    >
      <Cell
        v-for="(c, i) in pieColors"
        :key="i"
        :fill="c"
      />
    </Pie>
  </PieChart>
  <!-- Radar -->
  <RadarChart
    v-else
    :data="radarData"
    :style="{ width: '100%', height: '160px' }"
  >
    <PolarGrid />
    <Radar
      data-key="v"
      stroke="#f97316"
      fill="#f97316"
      :fill-opacity="0.3"
    />
  </RadarChart>
</template>
